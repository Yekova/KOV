import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getNewLeadsKpi } from "@/lib/admin/kpis";
import { getLeadStatuses } from "@/lib/leads/statuses";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { StatCard } from "@/components/admin/StatCard";
import { LeadPipelineFunnel } from "@/components/admin/leads/LeadPipelineFunnel";
import { LeadSourceDonut } from "@/components/admin/leads/LeadSourceDonut";
import { LeadsListView } from "@/components/admin/leads/LeadsListView";
import { normalizeLeadSource } from "@/lib/admin/status";
import type { LeadRow } from "@/components/admin/leads/types";

export const metadata: Metadata = {
  title: "Leads — Admin KOV",
};

export default async function AdminLeadsPage(props: PageProps<"/admin/leads">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const viewParam = typeof searchParams.view === "string" ? searchParams.view : "list";
  const initialView: "kanban" | "list" = viewParam === "kanban" ? "kanban" : "list";

  const [{ data: leads }, { data: adminProfiles }, newLeadsKpi, statuses] = await Promise.all([
    supabaseAdmin
      .from("leads")
      .select(
        "id, created_at, updated_at, name, email, phone, company, source, status, score, tags, budget_cents, assigned_to, last_contacted_at, next_action_note, next_action_date"
      )
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").is("archived_at", null).order("full_name"),
    getNewLeadsKpi(),
    getLeadStatuses(),
  ]);

  const allLeads = leads ?? [];
  const adminOptions = (adminProfiles ?? []).map((a) => ({ id: a.id, label: a.full_name || a.email }));
  const adminNameById = new Map(adminOptions.map((a) => [a.id, a.label]));

  const rows: LeadRow[] = allLeads.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    company: l.company,
    status: l.status,
    source: l.source,
    score: l.score,
    tags: l.tags ?? [],
    budgetCents: l.budget_cents,
    assignedTo: l.assigned_to,
    assigneeName: l.assigned_to ? (adminNameById.get(l.assigned_to) ?? null) : null,
    lastContactedAt: l.last_contacted_at,
    nextActionNote: l.next_action_note,
    nextActionDate: l.next_action_date,
    createdAt: l.created_at,
  }));

  // KPIs — computed from real data only, no fabricated deltas.
  const wonLeads = allLeads.filter((l) => l.status === "won");
  const lostLeads = allLeads.filter((l) => l.status === "lost");
  const resolvedCount = wonLeads.length + lostLeads.length;
  const conversionRate = resolvedCount > 0 ? Math.round((wonLeads.length / resolvedCount) * 100) : 0;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const wonThisMonth = wonLeads.filter((l) => new Date(l.updated_at) >= startOfMonth).length;
  const openLeads = allLeads.filter((l) => l.status !== "won" && l.status !== "lost");
  const potentialValueCents = openLeads.reduce((sum, l) => sum + (l.budget_cents ?? 0), 0);
  const avgConversionDays =
    wonLeads.length > 0
      ? Math.round(
          wonLeads.reduce((sum, l) => sum + (new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()) / 86_400_000, 0) /
            wonLeads.length
        )
      : null;

  const statusCounts: Record<string, number> = {};
  for (const lead of allLeads) statusCounts[lead.status] = (statusCounts[lead.status] ?? 0) + 1;

  const sourceCounts: Record<string, number> = {};
  for (const lead of allLeads) {
    const source = normalizeLeadSource(lead.source);
    sourceCounts[source] = (sourceCounts[source] ?? 0) + 1;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Leads</h1>
          <p className="text-kov-steel text-sm mt-1">Suivi et conversion de vos opportunités commerciales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Nouveaux leads"
          value={String(newLeadsKpi.value)}
          evolutionPercent={newLeadsKpi.evolutionPercent}
          isNew={newLeadsKpi.isNew}
          evolutionCaption="vs mois dernier"
          sparkline={newLeadsKpi.sparkline}
        />
        <StatCard label="Taux de conversion" value={`${conversionRate}%`} caption="Sur les leads clos" />
        <StatCard label="Leads convertis" value={String(wonLeads.length)} caption={`+${wonThisMonth} ce mois`} />
        <StatCard label="Valeur potentielle" value={`${(potentialValueCents / 100).toLocaleString("fr-FR")} €`} caption="Leads actifs" />
        <StatCard label="Temps moyen / conversion" value={avgConversionDays !== null ? `${avgConversionDays} jours` : "—"} caption="Estimation" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <LeadPipelineFunnel counts={statusCounts} statuses={statuses} />
        </div>
        <LeadSourceDonut counts={sourceCounts} total={allLeads.length} />
      </div>

      <LeadsListView initialLeads={rows} statuses={statuses} admins={adminOptions} initialView={initialView} />
    </main>
  );
}
