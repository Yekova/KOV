import { KpiCard } from "./KpiCard";
import { GlobalProgressCard } from "./GlobalProgressCard";
import type { KpiResult } from "@/lib/admin/kpis";

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

export function KpiGrid({
  activeProjects,
  newLeads,
  monthlyRevenue,
  pendingTasks,
  globalProgress,
}: {
  activeProjects: KpiResult;
  newLeads: KpiResult;
  monthlyRevenue: KpiResult;
  pendingTasks: KpiResult;
  globalProgress: { percent: number; projectsThisMonth: number; doneCount: number; overdueCount: number };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard
        label="Projets actifs"
        value={String(activeProjects.value)}
        evolutionPercent={activeProjects.evolutionPercent}
        isNew={activeProjects.isNew}
        evolutionCaption="nouveaux ce mois"
        sparkline={activeProjects.sparkline}
      />
      <KpiCard
        label="Nouveaux leads"
        value={String(newLeads.value)}
        evolutionPercent={newLeads.evolutionPercent}
        isNew={newLeads.isNew}
        evolutionCaption="vs mois dernier"
        sparkline={newLeads.sparkline}
      />
      <KpiCard
        label="CA mensuel"
        value={formatEuros(monthlyRevenue.value)}
        evolutionPercent={monthlyRevenue.evolutionPercent}
        isNew={monthlyRevenue.isNew}
        evolutionCaption="vs mois dernier"
        sparkline={monthlyRevenue.sparkline}
      />
      <KpiCard
        label="Tâches en attente"
        value={String(pendingTasks.value)}
        evolutionPercent={pendingTasks.evolutionPercent}
        isNew={pendingTasks.isNew}
        evolutionCaption="créées vs hier"
        sparkline={pendingTasks.sparkline}
      />
      <GlobalProgressCard {...globalProgress} />
    </div>
  );
}
