import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { PortalSidebar } from "@/components/client/PortalSidebar";
import { PortalTopbar } from "@/components/client/PortalTopbar";

export default async function ClientLayout({ children }: LayoutProps<"/client">) {
  const user = await requireUser();

  const [{ data: profile }, { count: unreadCount }, { count: openRequestsCount }] = await Promise.all([
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
  ]);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--kov-black)" }}>
      <PortalSidebar openRequestsCount={openRequestsCount ?? 0} />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalTopbar
          fullName={profile?.full_name ?? null}
          avatarUrl={getPublicAssetUrl(profile?.avatar_path)}
          unreadCount={unreadCount ?? 0}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
