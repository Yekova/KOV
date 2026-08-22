import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PortalSidebar } from "./PortalSidebar";

// Isolated in its own Suspense boundary (see client/layout.tsx) so the
// sidebar's own nav never waits on this one count — mirrors the admin
// shell's SidebarBadges for the exact same reason (requireUser() reading
// cookies() makes the whole layout dynamic, which otherwise blocks route
// transitions on every query in it).
export async function ClientSidebarBadges({ userId }: { userId: string }) {
  const { count: openRequestsCount } = await supabaseAdmin
    .from("request_threads")
    .select("id", { count: "exact", head: true })
    .eq("client_id", userId)
    .eq("status", "open");

  return <PortalSidebar openRequestsCount={openRequestsCount ?? 0} />;
}
