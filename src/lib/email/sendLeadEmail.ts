import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getEmailProvider } from "./providers/brevoProvider";
import { logLeadInteraction } from "@/lib/leads/interactions";
import { recomputeLeadScore } from "@/lib/leads/recomputeScore";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The single write path for "a lead email actually left the building" —
// used by both the composer's send action and (later) the scheduled-send
// worker, so every send goes through the same validation, logging,
// last_contacted_at bump, interaction log, and score recompute exactly
// once, no matter which UI surface triggered it.
export async function sendLeadEmail(params: {
  leadId: string;
  senderId: string;
  templateId: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string;
}): Promise<{ error: string | null; emailLogId?: string }> {
  const { data: lead } = await supabaseAdmin.from("leads").select("id, email, name").eq("id", params.leadId).maybeSingle();
  if (!lead) return { error: "Lead introuvable." };
  if (!lead.email || !EMAIL_PATTERN.test(lead.email)) return { error: "Le lead ne possède pas d'adresse email valide." };
  if (!params.subject.trim()) return { error: "L'objet est requis." };
  if (!params.bodyHtml.trim() || params.bodyHtml === "<p></p>") return { error: "Le contenu de l'email ne peut pas être vide." };

  const { data: row, error: insertError } = await supabaseAdmin
    .from("email_logs")
    .insert({
      lead_id: params.leadId,
      template_id: params.templateId,
      sender_id: params.senderId,
      recipient: lead.email,
      subject: params.subject,
      body: params.bodyHtml,
      body_text: params.bodyText,
      status: "queued",
    })
    .select("id")
    .single();
  if (insertError || !row) return { error: "L'enregistrement de l'email a échoué." };

  try {
    const result = await getEmailProvider().send({
      to: lead.email,
      toName: lead.name,
      subject: params.subject,
      html: params.bodyHtml,
      text: params.bodyText,
    });

    await supabaseAdmin
      .from("email_logs")
      .update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: result.providerMessageId })
      .eq("id", row.id);
  } catch (err) {
    await supabaseAdmin.from("email_logs").update({ status: "failed", failed_at: new Date().toISOString() }).eq("id", row.id);
    return { error: err instanceof Error ? err.message : "L'envoi de l'email a échoué." };
  }

  await supabaseAdmin.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", params.leadId);
  await logLeadInteraction({
    leadId: params.leadId,
    type: "email",
    actorId: params.senderId,
    content: params.subject,
    metadata: { email_log_id: row.id },
  });
  await recomputeLeadScore(params.leadId);

  return { error: null, emailLogId: row.id };
}
