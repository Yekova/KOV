import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { DateBadge } from "@/components/admin/DateBadge";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";

export type ProjectTableRow = {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  managerName: string | null;
  status: string;
  progressPercent: number;
  dueDate: string | null;
};

export function ProjectTable({
  projects,
  title,
  viewAllHref,
}: {
  projects: ProjectTableRow[];
  title?: string;
  viewAllHref?: string;
}) {
  const now = new Date();

  return (
    <GlassCard className="p-5">
      {(title || viewAllHref) && (
        <div className="flex items-center justify-between mb-4">
          {title && <p className="text-xs uppercase tracking-widest text-kov-steel">{title}</p>}
          {viewAllHref && (
            <Link href={viewAllHref} className="text-kov-red text-xs hover:underline">
              Voir tout
            </Link>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState message="Aucun projet pour l'instant." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                <th className="py-2 pr-4">Projet</th>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Chef de projet</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2 pr-4">Progression</th>
                <th className="py-2 pr-4">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const isOverdue = !!project.dueDate && new Date(project.dueDate) < now && project.status !== "done";
                return (
                  <tr key={project.id} className="border-b" style={{ borderColor: "var(--kov-border)" }}>
                    <td className="py-3 pr-4">
                      <Link href={`/admin/clients/${project.clientId}`} className="text-kov-bone hover:text-kov-red transition-colors">
                        {project.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-kov-steel">{project.clientName}</td>
                    <td className="py-3 pr-4 text-kov-steel">{project.managerName || "—"}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge
                        label={PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
                        tone={project.status === "done" ? "positive" : "neutral"}
                      />
                    </td>
                    <td className="py-3 pr-4 w-32">
                      <ProgressBar percent={project.progressPercent} />
                    </td>
                    <td className="py-3 pr-4">
                      {project.dueDate ? <DateBadge date={project.dueDate} isOverdue={isOverdue} /> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
