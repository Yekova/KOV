import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type ActivityLogType = "document" | "message" | "invoice" | "milestone" | "quote";

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
