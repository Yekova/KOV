import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { KovProgress } from "@/components/ui/KovProgress";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";

export type ShowcaseProject = {
  id: string;
  name: string;
  category: string;
  status: string;
  progressPercent: number;
  /** D'où vient le pourcentage : des phases, ou de la saisie manuelle. */
  progressSource: "phases" | "saisi";
  currentPhase: string | null;
  nextDeadline: string | null;
};

// Les projets, en vignettes plutôt qu'en lignes.
//
// Ils étaient une liste étroite dans la colonne de droite : une pastille de
// 48px, un nom, un filet de progression. Le projet est la raison d'être de
// cet espace ; il occupe maintenant la largeur, avec son image quand il en
// a une.
//
// Ce qui est écrit sous la barre n'est pas décoratif : le pourcentage seul
// ne dit pas d'où il sort. « 3 phases sur 7 » le dit, et quand le projet
// n'a pas de phases, la mention disparaît plutôt que de mentir sur sa
// source.

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function ProjectShowcase({ projects }: { projects: ShowcaseProject[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-kov-concrete">Autres projets</h2>
        {projects.length > 0 && (
          <Link href="/client/projects" className="text-xs uppercase tracking-widest text-kov-red hover:underline">
            Voir tous →
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <GlassCard className="p-8">
          <p className="text-sm text-kov-bone">
            Aucun projet pour l&apos;instant<span className="text-kov-red">.</span>
          </p>
          <p className="mt-2 text-sm text-kov-concrete">
            Dès que le studio ouvre un projet à votre nom, il apparaît ici avec son avancement.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.slice(0, 6).map((project) => {
            const color = PROJECT_STATUS_COLORS[project.status] ?? "var(--kov-steel)";
            return (
              <div key={project.id} className="kov-surface kov-lift overflow-hidden">
                <Link href={`/client/projects/${project.id}`} className="group block">
                  {/* Le bandeau visuel a disparu : 128 pixels d'image par
                      carte, dont le repli était une initiale géante, pour
                      une liste qu'on parcourt par les noms. Le statut, qui
                      y était posé en pastille sur fond sombre en dur,
                      redescend dans le texte. */}

                  <span className="block p-5">
                    <span className="mb-2 block text-[10px] tracking-widest uppercase" style={{ color }}>
                      {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
                    </span>
                    <span className="block truncate text-[15px] text-kov-bone transition-colors group-hover:text-kov-red">
                      {project.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-kov-concrete">{project.category}</span>

                    <span className="mt-4 flex items-center gap-3">
                      <span className="block flex-1">
                        <KovProgress
                          percent={project.progressPercent}
                          color={color}
                          label={`Avancement de ${project.name}`}
                        />
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-kov-bone">{project.progressPercent} %</span>
                    </span>

                    {project.currentPhase && (
                      <span className="mt-3 block truncate text-xs text-kov-concrete">
                        En cours : <span className="text-kov-bone">{project.currentPhase}</span>
                      </span>
                    )}

                    {project.nextDeadline && (
                      <span className="mt-1 block text-xs text-kov-concrete">
                        Prochaine échéance : <span className="text-kov-bone">{formatDate(project.nextDeadline)}</span>
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
