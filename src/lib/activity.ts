import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email/brevo";
import {
  requestReplyNotificationSubject,
  requestReplyNotificationHtml,
  adminReplyNotificationSubject,
  adminReplyNotificationHtml,
} from "@/lib/email/reminderEmail";

export type ActivityLogType = "document" | "message" | "invoice" | "milestone" | "quote" | "task";

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

// Client messages otherwise only surface via the in-app notification bell —
// invisible unless someone happens to be logged into the admin panel. Best
// effort: a failed send here must never break the reply/thread-creation
// action itself, so callers don't need to (and shouldn't) await/catch this.
export async function notifyAdminsOfClientMessage(params: {
  clientId: string;
  clientDisplayName: string;
  subject: string;
}) {
  try {
    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin")
      .is("archived_at", null);

    const recipients = (admins ?? []).filter((a): a is { email: string; full_name: string | null } => !!a.email);
    if (recipients.length === 0) return;

    const emailData = { clientDisplayName: params.clientDisplayName, subject: params.subject, clientId: params.clientId };
    const html = await requestReplyNotificationHtml(emailData);
    const subject = requestReplyNotificationSubject(emailData);

    await Promise.allSettled(
      recipients.map((admin) => sendEmail({ to: admin.email, toName: admin.full_name ?? undefined, subject, html }))
    );
  } catch {
    // Swallowed deliberately — see comment above.
  }
}

// The other direction — until this existed, a client had no way to learn an
// admin had replied to their request except by happening to open the
// portal. Same best-effort contract as notifyAdminsOfClientMessage: never
// throws, a failed send must not break the admin's reply action itself.
export async function notifyClientOfAdminReply(params: { clientId: string; subject: string }) {
  try {
    const { data: client } = await supabaseAdmin.from("profiles").select("email, full_name").eq("id", params.clientId).maybeSingle();
    if (!client?.email) return;

    const firstName = (client.full_name || "").split(" ")[0] || client.full_name || "";
    const emailData = { firstName, subject: params.subject };
    const html = await adminReplyNotificationHtml(emailData);
    const subject = adminReplyNotificationSubject(emailData);

    await sendEmail({ to: client.email, toName: client.full_name ?? undefined, subject, html });
  } catch {
    // Swallowed deliberately — see comment above.
  }
}
