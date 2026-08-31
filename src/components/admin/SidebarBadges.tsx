import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AdminSidebar } from "./AdminSidebar";

// Isolated in its own Suspense boundary (see admin/layout.tsx) so the
// (static, client-rendered) nav itself never waits on these two counts —
// only the small red badge numbers pop in a beat later.
export async function SidebarBadges() {
  const [{ count: newLeadsBadge }, { count: pendingTasksBadge }] = await Promise.all([
    supabaseAdmin.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabaseAdmin.from("project_tasks").select("id", { count: "exact", head: true }).in("status", ["backlog", "todo", "blocked"]),
  ]);

  return <AdminSidebar badgeCounts={{ leads: newLeadsBadge ?? 0, tasks: pendingTasksBadge ?? 0 }} />;
}
