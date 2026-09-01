import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getActiveProjectsKpi, getMonthlyRevenueKpi } from "@/lib/admin/kpis";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { StatCard } from "@/components/admin/StatCard";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { ProjectPipeline } from "@/components/admin/dashboard/ProjectPipeline";
import { LeadFeed } from "@/components/admin/dashboard/LeadFeed";
import { TeamWorkload } from "@/components/admin/dashboard/TeamWorkload";
import { ProjectTable } from "@/components/admin/dashboard/ProjectTable";
import { TaskFeed } from "@/components/admin/dashboard/TaskFeed";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";
import { RevenueChart, type RevenuePoint } from "@/components/admin/dashboard/RevenueChart";
import { Donut, type DonutSegment } from "@/components/admin/Donut";
import { getLeadStatuses } from "@/lib/leads/statuses";

export const metadata: Metadata = {
  title: "Dashboard — Admin KOV",
};

const CATEGORY_COLORS = ["var(--kov-red)", "#5B8DEF", "#9B6DFF", "#F5A524", "#3FB27F", "#F5629B"];
const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    { data: projects },
    { data: phases },
    { data: recentLeads },
    { data: activity },
    { data: adminProfiles },
    { data: openTasks },
    { data: pendingTasks },
    { count: totalTaskCount },
    { count: inProgressTaskCount },
    { data: pendingInvoiceRows },
    { data: allLeads },
    { data: todayTimeEntries },
    { data: paidInvoices },
    leadStatuses,
  ] = await Promise.all([
    supabaseAdmin
      .from("projects")
      .select(
        "id, name, category, status, pipeline_stage, progress_percent, next_deadline_date, budget_cents, currency, client_id, project_manager_id, created_at"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("project_phases").select("id, project_id, name, status, position").order("position"),
    supabaseAdmin
      .from("leads")
      .select("id, name, company, project_type, status, created_at, budget_cents")
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("activity_log")
      .select("id, type, title, admin_title, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin.from("profiles").select("id, full_name, email, display_title").eq("role", "admin").is("archived_at", null),
    // Workload = everything not finished yet, not an explicit status
    // allowlist — stays correct automatically if the task vocabulary
    // ever widens again.
    supabaseAdmin.from("project_tasks").select("assigned_to").neq("status", "done"),
    supabaseAdmin
      .from("project_tasks")
      .select("id, title, priority, assigned_to, project_id, due_date")
      .in("status", ["backlog", "todo", "blocked"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin.from("project_tasks").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("project_tasks").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
    supabaseAdmin.from("invoices").select("amount_cents").in("status", ["sent", "overdue"]),
    supabaseAdmin.from("leads").select("id, status, created_at"),
    supabaseAdmin
      .from("task_time_entries")
      .select("minutes")
      .eq("user_id", user.id)
      .gte("started_at", startOfToday.toISOString())
      .not("minutes", "is", null),
    supabaseAdmin
      .from("invoices")
      .select("amount_cents, paid_at, project_id")
      .eq("status", "paid")
      .gte("paid_at", twelveMonthsAgo.toISOString()),
    getLeadStatuses(),
  ]);

  const projectRows = projects ?? [];
  const adminRows = adminProfiles ?? [];
  const phaseRows = phases ?? [];

  const clientIds = Array.from(new Set(projectRows.map((p) => p.client_id)));

  const [{ data: clientProfiles }] = await Promise.all([
    clientIds.length
      ? supabaseAdmin.from("profiles").select("id, full_name, email, company").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string; company: string | null }[] }),
  ]);

  const clientNameById = new Map((clientProfiles ?? []).map((c) => [c.id, c.full_name || c.company || c.email]));
  const managerNameById = new Map(adminRows.map((a) => [a.id, a.full_name || a.email]));

  // Current phase per project: the first non-completed phase in position
  // order, or the last one if every phase is already done. Projects with
  // no phases (nothing created yet, or the "Ajouter les phases KOV"
  // button was never used) simply show no phase.
  const phasesByProject = new Map<string, typeof phaseRows>();
  for (const phase of phaseRows) {
    const list = phasesByProject.get(phase.project_id) ?? [];
    list.push(phase);
    phasesByProject.set(phase.project_id, list);
  }
  const currentPhaseNameByProject = new Map<string, string>();
  for (const [projectId, list] of phasesByProject) {
    const current = list.find((p) => p.status !== "completed") ?? list[list.length - 1];
    if (current) currentPhaseNameByProject.set(projectId, current.name);
  }

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
    phaseName: currentPhaseNameByProject.get(p.id) ?? null,
    status: p.status,
    progressPercent: p.progress_percent,
    dueDate: p.next_deadline_date,
  }));

  const taskFeedItems = (pendingTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    projectName: projectRows.find((p) => p.id === t.project_id)?.name ?? "—",
    assigneeName: t.assigned_to ? managerNameById.get(t.assigned_to) ?? null : null,
    priority: t.priority,
    dueDate: t.due_date,
  }));

  const leadFeedItems = (recentLeads ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company,
    project_type: l.project_type,
    status: l.status,
    created_at: l.created_at,
    budget_cents: l.budget_cents,
  }));

  const [activeProjectsKpi, monthlyRevenueKpi] = await Promise.all([
    Promise.resolve(getActiveProjectsKpi(projectRows)),
    getMonthlyRevenueKpi(),
  ]);
  const currentAdminName = adminRows.find((a) => a.id === user.id)?.full_name ?? null;

  // Real KPIs computed from the rows already fetched above — no fabricated
  // deltas where there's no clean definition for one.
  const pendingInvoiceCents = (pendingInvoiceRows ?? []).reduce((sum, r) => sum + r.amount_cents, 0);
  const activeLeads = (allLeads ?? []).filter((l) => l.status !== "won" && l.status !== "lost");
  const newLeadsThisMonth = (allLeads ?? []).filter((l) => new Date(l.created_at) >= startOfMonth).length;
  const todayMinutes = (todayTimeEntries ?? []).reduce((sum, e) => sum + (e.minutes ?? 0), 0);
  const todayHours = todayMinutes / 60;
  const tasksInProgressPercent = totalTaskCount ? Math.round(((inProgressTaskCount ?? 0) / totalTaskCount) * 100) : 0;

  // Revenue evolution — real paid-invoice sums, bucketed by calendar month
  // over the last 12 months. Months with no paid invoices show as zero,
  // not interpolated.
  const revenueByMonth = new Map<string, number>();
  for (const inv of paidInvoices ?? []) {
    if (!inv.paid_at) continue;
    const d = new Date(inv.paid_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + inv.amount_cents);
  }
  const revenuePoints: RevenuePoint[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    return { label: MONTH_LABELS[d.getMonth()], cents: revenueByMonth.get(key) ?? 0 };
  });

  // Revenue by project category — real category values from the projects
  // table (free text, admin-entered), not a fabricated fixed bucket set.
  // Invoices with no linked project (or a project with no category) group
  // under "Autre".
  const categoryByProjectId = new Map(projectRows.map((p) => [p.id, p.category]));
  const revenueByCategory = new Map<string, number>();
  for (const inv of paidInvoices ?? []) {
    const category = (inv.project_id && categoryByProjectId.get(inv.project_id)) || "Autre";
    revenueByCategory.set(category, (revenueByCategory.get(category) ?? 0) + inv.amount_cents);
  }
  const categorySegments: DonutSegment[] = Array.from(revenueByCategory.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([category, cents], i) => ({ key: category, label: category, value: cents, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="Chiffre d'affaires (mois)"
            value={formatEuros(monthlyRevenueKpi.value)}
            evolutionPercent={monthlyRevenueKpi.evolutionPercent}
            isNew={monthlyRevenueKpi.isNew}
            evolutionCaption="vs mois dernier"
            sparkline={monthlyRevenueKpi.sparkline}
          />
          <KpiCard
            label="Projets en cours"
            value={String(activeProjectsKpi.value)}
            evolutionPercent={activeProjectsKpi.evolutionPercent}
            isNew={activeProjectsKpi.isNew}
            evolutionCaption="nouveaux ce mois"
            sparkline={activeProjectsKpi.sparkline}
          />
          <StatCard
            label="Tâches en cours"
            value={`${inProgressTaskCount ?? 0} / ${totalTaskCount ?? 0}`}
            caption={`${tasksInProgressPercent}% du total`}
            progress={tasksInProgressPercent}
            progressColor="#F5A524"
          />
          <StatCard
            label="Factures en attente"
            value={formatEuros(pendingInvoiceCents)}
            caption={`${(pendingInvoiceRows ?? []).length} facture${(pendingInvoiceRows ?? []).length > 1 ? "s" : ""}`}
          />
          <StatCard label="Leads en cours" value={String(activeLeads.length)} caption={`+${newLeadsThisMonth} ce mois`} />
          <StatCard
            label="Heures aujourd'hui"
            value={`${Math.floor(todayHours)}h${String(todayMinutes % 60).padStart(2, "0")}`}
            caption="Objectif : 8h"
            progress={Math.min(100, Math.round((todayHours / 8) * 100))}
            progressColor="#3FB27F"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <ProjectPipeline initialProjects={pipelineProjects} />
          </div>
          <LeadFeed leads={leadFeedItems} statuses={leadStatuses} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <TeamWorkload members={teamMembers} />
          <div className="xl:col-span-2 space-y-6">
            <ProjectTable projects={recentProjectsForTable} title="Projets récents" viewAllHref="/admin/projects" />
            <TaskFeed tasks={taskFeedItems} />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RevenueChart points={revenuePoints} />
          </div>
          <Donut title="Répartition des revenus" segments={categorySegments} centerLabel="Payé (12 mois)" formatValue={formatEuros} />
        </div>

        <ActivityFeed items={activity ?? []} />
      </main>
    </div>
  );
}
