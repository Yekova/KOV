import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendKovEmail } from "./sendKovEmail";
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

  // L'insertion, l'envoi, l'identifiant du fournisseur et l'erreur en base
  // sont désormais tenus par sendKovEmail : ce motif était recopié ici, et
  // c'est lui qui rend un email traçable. Ce qui reste ci-dessous est ce
  // que seul un email de LEAD doit faire.
  const result = await sendKovEmail({
    type: "LEAD_MESSAGE",
    to: lead.email,
    toName: lead.name,
    subject: params.subject,
    html: params.bodyHtml,
    text: params.bodyText,
    senderId: params.senderId,
    templateId: params.templateId,
    links: { leadId: params.leadId },
  });

  if (!result.success) return { error: result.error ?? "L'envoi de l'email a échoué." };

  await supabaseAdmin.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", params.leadId);
  await logLeadInteraction({
    leadId: params.leadId,
    type: "email",
    actorId: params.senderId,
    content: params.subject,
    metadata: { email_log_id: result.emailLogId },
  });
  await recomputeLeadScore(params.leadId);

  return { error: null, emailLogId: result.emailLogId };
}
