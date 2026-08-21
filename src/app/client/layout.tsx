import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { PortalShell } from "@/components/client/PortalShell";
import type { ClientNotificationItem } from "@/components/client/NotificationBell";

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

export default async function ClientLayout({ children }: LayoutProps<"/client">) {
  const user = await requireUser();

  const [{ data: profile }, { count: unreadCount }, { count: openRequestsCount }, { data: recentActivity }] = await Promise.all([
    supabaseAdmin.from("profiles").select("full_name, avatar_path").eq("id", user.id).maybeSingle(),
    supabaseAdmin
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id)
      .is("read_at", null),
    supabaseAdmin
      .from("request_threads")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id)
      .eq("status", "open"),
    supabaseAdmin
      .from("activity_log")
      .select("id, type, title, project_id, created_at")
      .eq("client_id", user.id)
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
    <PortalShell
      fullName={profile?.full_name ?? null}
      avatarUrl={getPublicAssetUrl(profile?.avatar_path)}
      unreadCount={unreadCount ?? 0}
      notifications={notifications}
      openRequestsCount={openRequestsCount ?? 0}
    >
      {children}
    </PortalShell>
  );
}
