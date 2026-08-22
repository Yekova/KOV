import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { PortalTopbar } from "./PortalTopbar";
import type { ClientNotificationItem } from "./NotificationBell";

function notificationHref(type: string, projectId: string | null): string {
  switch (type) {
    case "message":
      return "/client/requests";
    case "invoice":
      return "/client/invoices";
    case "quote":
      return "/client/quotes";
    case "document":
      return projectId ? `/client/projects/${projectId}` : "/client/documents";
    default:
      return projectId ? `/client/projects/${projectId}` : "/client";
  }
}

// Isolated in its own Suspense boundary (see client/layout.tsx) — same
// rationale as the admin shell's AdminTopbarData: this is the heaviest part
// of the portal shell, so it must never block route transitions.
export async function PortalTopbarData({ userId }: { userId: string }) {
  const [{ data: profile }, { count: unreadCount }, { data: recentActivity }] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name, avatar_path").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("activity_log").select("id", { count: "exact", head: true }).eq("client_id", userId).is("read_at", null),
    supabaseAdmin
      .from("activity_log")
      .select("id, type, title, project_id, created_at")
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const notifications: ClientNotificationItem[] = (recentActivity ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    href: notificationHref(a.type, a.project_id),
    createdAt: a.created_at,
  }));

  return (
    <PortalTopbar
      fullName={profile?.full_name ?? null}
      avatarUrl={getPublicAssetUrl(profile?.avatar_path)}
      unreadCount={unreadCount ?? 0}
      notifications={notifications}
    />
  );
}
