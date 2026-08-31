import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getComparisonRanges, computeEvolution, getDailyBuckets } from "./period";

export type KpiResult = {
  value: number;
  evolutionPercent: number | null;
  isNew: boolean;
  sparkline: number[];
};

type ProjectRow = {
  status: string;
  created_at: string;
  progress_percent: number;
  next_deadline_date: string | null;
};

// "Active projects" is a point-in-time snapshot — there is no historical
// snapshot table to compare "the active count as of last month" against.
// The evolution shown is a defined, honest proxy: how many projects became
// active (created and still not done) this month vs last month — a real
// flow metric, not a fabricated retrospective of the snapshot itself.
export function getActiveProjectsKpi(projects: ProjectRow[]): KpiResult {
  const activeCount = projects.filter((p) => p.status !== "done").length;
  const { current, previous } = getComparisonRanges("month");

  const becameActiveThisMonth = projects.filter(
    (p) => p.status !== "done" && new Date(p.created_at) >= current.start
  ).length;
  const becameActivePrevMonth = projects.filter(
    (p) =>
      p.status !== "done" &&
      new Date(p.created_at) >= previous.start &&
      new Date(p.created_at) < previous.end
  ).length;

  const { percent, isNew } = computeEvolution(becameActiveThisMonth, becameActivePrevMonth);

  const days = getDailyBuckets(current.start, current.end);
  const sparkline = days.map(
    (day) => projects.filter((p) => p.status !== "done" && new Date(p.created_at) <= day).length
  );

  return { value: activeCount, evolutionPercent: percent, isNew, sparkline };
}

export async function getNewLeadsKpi(): Promise<KpiResult> {
  const { current, previous } = getComparisonRanges("month");

  const [{ count: currentCount }, { count: previousCount }, { data: currentLeads }] = await Promise.all([
    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", current.start.toISOString()),
    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", previous.start.toISOString())
      .lt("created_at", previous.end.toISOString()),
    supabaseAdmin.from("leads").select("created_at").gte("created_at", current.start.toISOString()),
  ]);

  const { percent, isNew } = computeEvolution(currentCount ?? 0, previousCount ?? 0);
  const days = getDailyBuckets(current.start, current.end);
  const sparkline = days.map(
    (day) => (currentLeads ?? []).filter((l) => new Date(l.created_at) <= day).length
  );

  return { value: currentCount ?? 0, evolutionPercent: percent, isNew, sparkline };
}

export async function getMonthlyRevenueKpi(): Promise<KpiResult> {
  const { current, previous } = getComparisonRanges("month");

  const [{ data: currentInvoices }, { data: previousInvoices }] = await Promise.all([
    supabaseAdmin
      .from("invoices")
      .select("amount_cents, paid_at")
      .eq("status", "paid")
      .gte("paid_at", current.start.toISOString()),
    supabaseAdmin
      .from("invoices")
      .select("amount_cents")
      .eq("status", "paid")
      .gte("paid_at", previous.start.toISOString())
      .lt("paid_at", previous.end.toISOString()),
  ]);

  const currentSum = (currentInvoices ?? []).reduce((sum, i) => sum + i.amount_cents, 0);
  const previousSum = (previousInvoices ?? []).reduce((sum, i) => sum + i.amount_cents, 0);
  const { percent, isNew } = computeEvolution(currentSum, previousSum);

  const days = getDailyBuckets(current.start, current.end);
  const sparkline = days.map((day) =>
    (currentInvoices ?? [])
      .filter((i) => i.paid_at && new Date(i.paid_at) <= day)
      .reduce((sum, i) => sum + i.amount_cents, 0)
  );

  return { value: currentSum, evolutionPercent: percent, isNew, sparkline };
}

// "Pending tasks" is likewise a snapshot with no historical baseline — the
// evolution proxy here is tasks created today vs yesterday (a real flow
// metric), not a retrospective of the pending count itself.
export async function getPendingTasksKpi(): Promise<KpiResult> {
  const { current, previous } = getComparisonRanges("day");
  const sparklineStart = new Date(current.end);
  sparklineStart.setDate(sparklineStart.getDate() - 7);

  const [{ count: pendingNow }, { count: createdToday }, { count: createdYesterday }, { data: recentTasks }] =
    await Promise.all([
      supabaseAdmin.from("project_tasks").select("id", { count: "exact", head: true }).in("status", ["backlog", "todo", "blocked"]),
      supabaseAdmin
        .from("project_tasks")
        .select("id", { count: "exact", head: true })
        .gte("created_at", current.start.toISOString()),
      supabaseAdmin
        .from("project_tasks")
        .select("id", { count: "exact", head: true })
        .gte("created_at", previous.start.toISOString())
        .lt("created_at", previous.end.toISOString()),
      supabaseAdmin.from("project_tasks").select("created_at").gte("created_at", sparklineStart.toISOString()),
    ]);

  const { percent, isNew } = computeEvolution(createdToday ?? 0, createdYesterday ?? 0);
  const days = getDailyBuckets(sparklineStart, current.end, 7);
  const sparkline = days.map(
    (day) => (recentTasks ?? []).filter((t) => new Date(t.created_at) <= day).length
  );

  return { value: pendingNow ?? 0, evolutionPercent: percent, isNew, sparkline };
}

export function getGlobalProgressKpi(projects: ProjectRow[]) {
  const { current } = getComparisonRanges("month");
  const now = new Date();

  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress_percent, 0) / projects.length)
      : 0;

  const projectsThisMonth = projects.filter((p) => new Date(p.created_at) >= current.start).length;
  const doneCount = projects.filter((p) => p.status === "done").length;
  const overdueCount = projects.filter(
    (p) => p.next_deadline_date && new Date(p.next_deadline_date) < now && p.status !== "done"
  ).length;
  const inProgressCount = projects.length - doneCount;

  return { percent: avgProgress, projectsThisMonth, doneCount, overdueCount, inProgressCount };
}
