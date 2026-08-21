import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getActiveProjectsKpi, getNewLeadsKpi, getMonthlyRevenueKpi, getPendingTasksKpi, getGlobalProgressKpi } from "@/lib/admin/kpis";
import { KpiGrid } from "@/components/admin/dashboard/KpiGrid";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { ProjectPipeline } from "@/components/admin/dashboard/ProjectPipeline";
import { LeadFeed } from "@/components/admin/dashboard/LeadFeed";
import { TeamWorkload } from "@/components/admin/dashboard/TeamWorkload";
import { ProjectTable } from "@/components/admin/dashboard/ProjectTable";
import { TaskFeed } from "@/components/admin/dashboard/TaskFeed";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";

export const metadata: Metadata = {
  title: "Dashboard — Admin KOV",
};

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const [
    { data: projects },
    { data: recentLeads },
    { data: activity },
    { data: adminProfiles },
    { data: openTasks },
    { data: pendingTasks },
  ] = await Promise.all([
    supabaseAdmin
      .from("projects")
      .select(
        "id, name, category, status, pipeline_stage, progress_percent, next_deadline_date, budget_cents, currency, client_id, project_manager_id, created_at"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("leads")
      .select("id, name, company, project_type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("activity_log")
      .select("id, type, title, admin_title, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin.from("profiles").select("id, full_name, email, display_title").eq("role", "admin").is("archived_at", null),
    supabaseAdmin.from("project_tasks").select("assigned_to").in("status", ["todo", "in_progress", "blocked"]),
    supabaseAdmin
      .from("project_tasks")
      .select("id, title, priority, assigned_to, project_id")
      .in("status", ["todo", "blocked"])
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const projectRows = projects ?? [];
  const adminRows = adminProfiles ?? [];

  const clientIds = Array.from(new Set(projectRows.map((p) => p.client_id)));
  const managerIds = Array.from(
    new Set(projectRows.map((p) => p.project_manager_id).filter((id): id is string => !!id))
  );

  const [{ data: clientProfiles }] = await Promise.all([
    clientIds.length
      ? supabaseAdmin.from("profiles").select("id, full_name, email, company").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string; company: string | null }[] }),
  ]);

  const clientNameById = new Map(
    (clientProfiles ?? []).map((c) => [c.id, c.full_name || c.company || c.email])
  );
  const managerNameById = new Map(adminRows.map((a) => [a.id, a.full_name || a.email]));

  // Team workload: open task count per admin, relative to the busiest member.
  const openTaskCountByAdmin = new Map<string, number>();
  for (const t of openTasks ?? []) {
    if (!t.assigned_to) continue;
    openTaskCountByAdmin.set(t.assigned_to, (openTaskCountByAdmin.get(t.assigned_to) ?? 0) + 1);
  }
  const teamMembers = adminRows.map((a) => ({
    id: a.id,
    name: a.full_name || a.email,
    title: a.display_title,
    openTaskCount: openTaskCountByAdmin.get(a.id) ?? 0,
  }));

  const pipelineProjects = projectRows.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    budgetCents: p.budget_cents,
    currency: p.currency,
    pipelineStage: p.pipeline_stage,
    clientName: clientNameById.get(p.client_id) ?? "—",
  }));

  const recentProjectsForTable = projectRows.slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    clientId: p.client_id,
    clientName: clientNameById.get(p.client_id) ?? "—",
    managerName: p.project_manager_id ? managerNameById.get(p.project_manager_id) ?? null : null,
    status: p.status,
    progressPercent: p.progress_percent,
    dueDate: p.next_deadline_date,
  }));

  const taskFeedItems = (pendingTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    assigneeName: t.assigned_to ? managerNameById.get(t.assigned_to) ?? null : null,
    priority: t.priority,
  }));

  const [activeProjectsKpi, newLeadsKpi, monthlyRevenueKpi, pendingTasksKpi] = await Promise.all([
    Promise.resolve(getActiveProjectsKpi(projectRows)),
    getNewLeadsKpi(),
    getMonthlyRevenueKpi(),
    getPendingTasksKpi(),
  ]);
  const globalProgress = getGlobalProgressKpi(projectRows);
  const currentAdminName = adminRows.find((a) => a.id === user.id)?.full_name ?? null;

  return (
    <div className="relative isolate">
      {/* isolate: without it, the negative z-index below competes with the
          WHOLE app's stacking context, not just this page — the admin
          layout's own solid black background is a plain non-positioned box
          too, and per CSS painting order that beats a negative-z descendant
          no matter how deeply nested, so the photo silently painted behind
          it and never showed. isolate creates a local stacking context so
          -z-10 only has to lose to *this page's* content, as intended. */}
      {/* Absolute, not fixed — a fixed, viewport-spanning element ignores
          this wrapper's box entirely and paints over the sidebar/topbar too
          (isolate raises this whole wrapper's paint layer above their plain,
          non-positioned <aside>/<header>, so a fixed child bleeds into their
          screen area). Absolute confines it to this wrapper's own box, which
          is exactly the dashboard content column — it now simply scrolls
          with the page instead of staying pinned to the viewport. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kov/character/contact-frames/frame-015.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none -z-10"
      />
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, var(--kov-black) 85%)" }} />

      <main className="relative px-6 py-10 max-w-[1800px] mx-auto w-full space-y-6">
        <DashboardHeader fullName={currentAdminName} />

      <KpiGrid
        activeProjects={activeProjectsKpi}
        newLeads={newLeadsKpi}
        monthlyRevenue={monthlyRevenueKpi}
        pendingTasks={pendingTasksKpi}
        globalProgress={globalProgress}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ProjectPipeline initialProjects={pipelineProjects} />
        </div>
        <LeadFeed leads={recentLeads ?? []} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <TeamWorkload members={teamMembers} />
        <div className="xl:col-span-2 space-y-6">
          <ProjectTable projects={recentProjectsForTable} title="Projets récents" viewAllHref="/admin/projects" />
          <TaskFeed tasks={taskFeedItems} />
        </div>
      </div>

        <ActivityFeed items={activity ?? []} />
      </main>
    </div>
  );
}
