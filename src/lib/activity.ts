import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendKovEmail } from "@/lib/email/sendKovEmail";
import {
  requestReplyNotificationSubject,
  requestReplyNotificationHtml,
  adminReplyNotificationSubject,
  adminReplyNotificationHtml,
} from "@/lib/email/reminderEmail";

export type ActivityLogType =
  | "document"
  | "message"
  | "invoice"
  | "milestone"
  | "quote"
  | "task"
  // Validation collaborative des maquettes. Seuls les trois
  // évènements qui méritent d'interrompre quelqu'un écrivent ici —
  // le reste va dans design_activity, qui alimente le fil de la page
  // sans faire sonner la cloche.
  | "validation";

// The single write path into activity_log, for both the client-facing feed
// (title) and the agency-wide admin feed (admin_title) — these are two
// separately-phrased sentences for the same event, snapshotted at insert
// time (not live-joined), matching this table's existing convention.
// adminTitle is required so no call site can silently leave the admin feed
// blank.
export async function logActivity(params: {
  clientId: string;
  projectId?: string | null;
  type: ActivityLogType;
  title: string;
  adminTitle: string;
  actorId?: string | null;
  description?: string | null;
}) {
  await supabaseAdmin.from("activity_log").insert({
    client_id: params.clientId,
    project_id: params.projectId ?? null,
    type: params.type,
    title: params.title,
    admin_title: params.adminTitle,
    actor_id: params.actorId ?? null,
    description: params.description ?? null,
  });
}

export async function getActorDisplayName(actorId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("profiles").select("full_name, email").eq("id", actorId).maybeSingle();
  return data?.full_name || data?.email || "Équipe KOV";
}

// Prévenir le studio qu'un client a écrit.
//
// ── CE QUI N'ALLAIT PAS ──────────────────────────────────────────────
//
// Ce fichier importait sendEmail DIRECTEMENT du module Brevo. Trois
// conséquences, toutes invisibles :
//
// 1. L'envoi partait par Brevo même avec Resend configuré — or le domaine
//    n'est pas vérifié chez Brevo, donc ces messages n'arrivaient
//    vraisemblablement jamais.
// 2. Il contournait le GARDE-FOU du mode sûr, qui vit au niveau du
//    résolveur de fournisseur. Un déploiement de prévisualisation pouvait
//    donc écrire à de vrais clients : exactement le risque que
//    lib/email/safeMode existe pour écarter.
// 3. Il n'écrivait rien dans email_logs : aucune trace, aucun statut de
//    livraison, rien à relire quand on se demande si le message est parti.
//
// Tout passe désormais par sendKovEmail, le chemin d'écriture unique.
//
// Le contrat reste le même : au pire effort. Un envoi qui échoue ne doit
// jamais faire échouer la réponse elle-même — mais il laisse maintenant
// une ligne « failed » avec sa cause, au lieu de disparaître.
export async function notifyAdminsOfClientMessage(params: {
  clientId: string;
  clientDisplayName: string;
  subject: string;
}) {
  try {
    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("role", "admin")
      .is("archived_at", null);

    const recipients = (admins ?? []).filter(
      (a): a is { id: string; email: string; full_name: string | null } => !!a.email
    );
    if (recipients.length === 0) return;

    const emailData = { clientDisplayName: params.clientDisplayName, subject: params.subject, clientId: params.clientId };
    const html = await requestReplyNotificationHtml(emailData);
    const subject = requestReplyNotificationSubject(emailData);

    await Promise.allSettled(
      recipients.map((admin) =>
        sendKovEmail({
          type: "NOTIFICATION",
          to: admin.email,
          toName: admin.full_name,
          subject,
          html,
          links: { clientId: params.clientId },
          metadata: { reason: "client_message", adminId: admin.id },
        })
      )
    );
  } catch {
    // Au pire effort : voir le commentaire ci-dessus.
  }
}

// Prévenir le client que le studio a répondu.
//
// Sans lui, il n'a aucun moyen d'apprendre qu'on lui a répondu, sinon en
// ouvrant le portail par hasard. Même correction que ci-dessus : l'envoi
// partait en direct par Brevo, donc hors du fournisseur configuré, hors du
// garde-fou du mode sûr et hors du journal.
export async function notifyClientOfAdminReply(params: { clientId: string; subject: string }) {
  try {
    const { data: client } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", params.clientId)
      .maybeSingle();
    if (!client?.email) return;

    const firstName = (client.full_name || "").split(" ")[0] || client.full_name || "";
    const emailData = { firstName, subject: params.subject };
    const html = await adminReplyNotificationHtml(emailData);
    const subject = adminReplyNotificationSubject(emailData);

    await sendKovEmail({
      type: "NOTIFICATION",
      to: client.email,
      toName: client.full_name,
      subject,
      html,
      links: { clientId: params.clientId },
      metadata: { reason: "admin_reply" },
    });
  } catch {
    // Au pire effort : voir le commentaire ci-dessus.
  }
}
