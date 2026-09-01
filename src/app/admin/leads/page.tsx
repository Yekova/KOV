import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getNewLeadsKpi } from "@/lib/admin/kpis";
import { LeadStatusSelect } from "./LeadStatusSelect";
import { LeadSourceSelect } from "./LeadSourceSelect";
import { AssignLeadSelect } from "./AssignLeadSelect";
import { NewLeadModal } from "./NewLeadModal";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { StatCard } from "@/components/admin/StatCard";
import { LeadPipelineFunnel } from "@/components/admin/leads/LeadPipelineFunnel";
import { LeadSourceDonut } from "@/components/admin/leads/LeadSourceDonut";
import { EmptyState } from "@/components/admin/EmptyState";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, isLeadStatus, normalizeLeadSource, type LeadStatus } from "@/lib/admin/status";

export const metadata: Metadata = {
  title: "Leads — Admin KOV",
};

const TABS: { key: LeadStatus | "all"; label: string }[] = [
  { key: "all", label: "Tous" },
  ...LEAD_STATUSES.map((key) => ({ key, label: LEAD_STATUS_LABELS[key] })),
];

export default async function AdminLeadsPage(props: PageProps<"/admin/leads">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const tabParam = typeof searchParams.status === "string" ? searchParams.status : "";
  const activeTab: LeadStatus | "all" = tabParam === "all" || isLeadStatus(tabParam) ? (tabParam as LeadStatus | "all") : "all";

  const [{ data: leads }, { data: adminProfiles }, newLeadsKpi] = await Promise.all([
    supabaseAdmin
      .from("leads")
      .select("id, created_at, updated_at, name, email, phone, company, source, status, budget_cents, assigned_to")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").is("archived_at", null).order("full_name"),
    getNewLeadsKpi(),
  ]);

  const allLeads = leads ?? [];
  const adminOptions = (adminProfiles ?? []).map((a) => ({ id: a.id, label: a.full_name || a.email }));

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

  const tabCounts = new Map<LeadStatus | "all", number>([["all", allLeads.length], ...LEAD_STATUSES.map((s) => [s, statusCounts[s] ?? 0] as const)]);

  const tabLeads = activeTab === "all" ? allLeads : allLeads.filter((l) => l.status === activeTab);
  const rows = q
    ? tabLeads.filter(
        (l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q)
      )
    : tabLeads;

  function tabHref(tab: LeadStatus | "all") {
    const params = new URLSearchParams();
    params.set("status", tab);
    if (q) params.set("q", q);
    return `?${params.toString()}`;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Leads</h1>
          <p className="text-kov-steel text-sm mt-1">Suivi et conversion de vos opportunités commerciales.</p>
        </div>
        <NewLeadModal />
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
          <LeadPipelineFunnel counts={statusCounts} />
        </div>
        <LeadSourceDonut counts={sourceCounts} total={allLeads.length} />
      </div>

      <div>
        <div className="flex items-center gap-2 border-b overflow-x-auto" style={{ borderColor: "var(--kov-border)" }}>
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={tabHref(tab.key)}
                className="flex items-center gap-2 px-3 pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors"
                style={{
                  color: isActive ? "var(--kov-red)" : "var(--kov-steel)",
                  borderBottom: isActive ? "2px solid var(--kov-red)" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {tab.label}
                <span
                  className="px-1.5 py-0.5 text-[10px]"
                  style={{
                    background: isActive ? "var(--kov-red)" : "var(--kov-graphite)",
                    color: isActive ? "var(--kov-white)" : "var(--kov-steel)",
                    borderRadius: "var(--radius-pill)",
                  }}
                >
                  {tabCounts.get(tab.key) ?? 0}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 mt-4 mb-4">
          <p className="text-kov-steel text-xs uppercase tracking-widest">
            {activeTab === "all" ? "Tous les leads" : LEAD_STATUS_LABELS[activeTab]} — {rows.length} lead{rows.length > 1 ? "s" : ""}
          </p>
          <form method="GET">
            <input type="hidden" name="status" value={activeTab} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Rechercher un lead…"
              className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            />
          </form>
        </div>

        {rows.length === 0 ? (
          <EmptyState message={q ? "Aucun lead ne correspond à cette recherche." : "Aucun lead dans cette catégorie."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                  <th className="py-3 pr-4">Lead</th>
                  <th className="py-3 pr-4">Entreprise</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 pr-4">Valeur potentielle</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 pr-4">Assigné à</th>
                  <th className="py-3 pr-4">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => (
                  <tr key={lead.id} className="border-b align-top" style={{ borderColor: "var(--kov-border)" }}>
                    <td className="py-4 pr-4">
                      <Link href={`/admin/leads/${lead.id}`} className="text-kov-bone hover:text-kov-red transition-colors">
                        {lead.name}
                      </Link>
                      <p className="text-kov-steel text-xs mt-0.5">
                        <a href={`mailto:${lead.email}`} className="hover:text-kov-red transition-colors">
                          {lead.email}
                        </a>
                      </p>
                    </td>
                    <td className="py-4 pr-4 text-kov-steel">{lead.company || "—"}</td>
                    <td className="py-4 pr-4">
                      <LeadSourceSelect leadId={lead.id} source={lead.source} />
                    </td>
                    <td className="py-4 pr-4 text-kov-bone whitespace-nowrap">
                      {lead.budget_cents ? `${(lead.budget_cents / 100).toLocaleString("fr-FR")} €` : "—"}
                    </td>
                    <td className="py-4 pr-4">
                      <LeadStatusSelect leadId={lead.id} status={lead.status} />
                    </td>
                    <td className="py-4 pr-4">
                      <AssignLeadSelect leadId={lead.id} assignedTo={lead.assigned_to} admins={adminOptions} />
                    </td>
                    <td className="py-4 pr-4 text-kov-steel whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
