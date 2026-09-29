import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getEmailProviderForSender } from "@/lib/email/resolveProvider";

// Le chemin d'écriture unique : « un email KOV est réellement parti ».
//
// sendLeadEmail existait déjà et faisait exactement ce motif — insérer une
// ligne en attente, envoyer, la mettre à jour avec l'identifiant du
// fournisseur — mais pour les leads seulement. Tout le reste partait sans
// laisser de trace : les invitations, les devis, les factures, les
// notifications. Une fois envoyés, on ne savait plus ni quand, ni à qui,
// ni s'ils étaient arrivés.
//
// Cette fonction généralise le motif au lieu d'en écrire un second.
// sendLeadEmail en devient un appelant, et garde ce qu'il est seul à faire
// (last_contacted_at, interaction, score).
//
// ── POURQUOI ON ÉCRIT AVANT D'ENVOYER ────────────────────────────────
//
// La ligne est insérée en « queued » AVANT l'appel au fournisseur. Si le
// processus meurt entre les deux, il reste une trace d'un envoi tenté —
// alors qu'écrire après laisserait un email parti et invisible, ce qui est
// le pire des deux états : impossible à rattraper, et impossible à savoir.
//
// ── provider_message_id EST LA CLÉ ───────────────────────────────────
//
// C'est par lui que le webhook Resend retrouve la ligne pour y poser
// delivered_at, opened_at, clicked_at. Sans lui, l'email est enregistré
// mais son sort restera inconnu pour toujours.

/** Le type fonctionnel d'un email. Sert à filtrer et à comprendre, jamais
 *  à brancher de la logique — d'où une colonne texte et non un enum. */
export type KovEmailType =
  | "WELCOME_CLIENT"
  | "LEAD_MESSAGE"
  | "PROPOSAL_SENT"
  | "PROPOSAL_REMINDER"
  | "INVOICE_SENT"
  | "INVOICE_REMINDER"
  | "PAYMENT_CONFIRMATION"
  | "PROJECT_UPDATE"
  | "VALIDATION_REQUEST"
  | "NOTIFICATION";

export interface KovEmailLinks {
  leadId?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  quoteId?: string | null;
  invoiceId?: string | null;
}

export interface SendKovEmailResult {
  success: boolean;
  emailLogId?: string;
  providerMessageId?: string | null;
  error?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendKovEmail(params: {
  type: KovEmailType;
  to: string;
  toName?: string | null;
  subject: string;
  html: string;
  text?: string;
  /** L'admin expéditeur, s'il y en a un. Décide entre sa boîte Outlook
   *  connectée et l'expéditeur partagé. */
  senderId?: string | null;
  templateId?: string | null;
  links?: KovEmailLinks;
  /** Déduplique un envoi rejoué chez Resend, 24 h. Indispensable aux
   *  relances : un cron relancé ne doit pas écrire deux fois au client. */
  idempotencyKey?: string;
  /** Contexte libre. Jamais de secret : ni clé d'API, ni lien signé. */
  metadata?: Record<string, unknown>;
}): Promise<SendKovEmailResult> {
  const to = params.to?.trim();
  if (!to || !EMAIL_PATTERN.test(to)) return { success: false, error: "Adresse email invalide." };
  if (!params.subject.trim()) return { success: false, error: "L'objet est requis." };
  if (!params.html.trim()) return { success: false, error: "Le contenu de l'email ne peut pas être vide." };

  const { data: row, error: insertError } = await supabaseAdmin
    .from("email_logs")
    .insert({
      email_type: params.type,
      lead_id: params.links?.leadId ?? null,
      client_id: params.links?.clientId ?? null,
      project_id: params.links?.projectId ?? null,
      quote_id: params.links?.quoteId ?? null,
      invoice_id: params.links?.invoiceId ?? null,
      template_id: params.templateId ?? null,
      sender_id: params.senderId ?? null,
      recipient: to,
      subject: params.subject,
      // Le corps stocké est le HTML RÉELLEMENT envoyé, variables déjà
      // substituées : une trace durable, indépendante des modifications
      // ultérieures du modèle.
      body: params.html,
      body_text: params.text ?? null,
      status: "queued",
      metadata: params.metadata ?? {},
    })
    .select("id")
    .single();

  if (insertError || !row) {
    return { success: false, error: "L'enregistrement de l'email a échoué." };
  }

  try {
    const provider = await getEmailProviderForSender(params.senderId);
    const result = await provider.send({
      to,
      toName: params.toName ?? undefined,
      subject: params.subject,
      html: params.html,
      text: params.text,
      idempotencyKey: params.idempotencyKey,
    });

    await supabaseAdmin
      .from("email_logs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: result.providerMessageId,
      })
      .eq("id", row.id);

    return { success: true, emailLogId: row.id, providerMessageId: result.providerMessageId };
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "L'envoi de l'email a échoué.";

    // La cause est écrite en base, pas seulement renvoyée : c'est ce qui
    // permet de comprendre trois jours plus tard pourquoi un client n'a
    // rien reçu, sans avoir à rejouer l'envoi.
    await supabaseAdmin
      .from("email_logs")
      .update({ status: "failed", failed_at: new Date().toISOString(), error_message: message.slice(0, 1000) })
      .eq("id", row.id);

    return { success: false, emailLogId: row.id, error: message };
  }
}
