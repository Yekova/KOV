import Link from "next/link";
import { PhaseTimeline, type TimelinePhase } from "@/components/client/dashboard/PhaseTimeline";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";

export interface FeaturedProject {
  id: string;
  name: string;
  category: string;
  status: string;
  progressPercent: number;
  currentPhase: string | null;
  nextDeadline: string | null;
  thumbnailUrl: string | null;
  phases: TimelinePhase[];
}

// Le projet principal, mis en scène.
//
// Tous les projets étaient présentés à l'identique, dans une grille de
// vignettes de même taille. Or un client en a rarement plus d'un en cours,
// et c'est CE projet qui motive sa visite. Le mettre au même rang que les
// autres, c'était refuser de répondre à la question qu'il se pose.
//
// La composition est en deux colonnes qui ne sont pas symétriques : le
// visuel prend la hauteur entière à gauche, la lecture se fait à droite.
// Pas de bordure entre les deux — c'est le changement de ton qui sépare.
//
// ── CE QUI N'Y EST PAS ───────────────────────────────────────────────
//
// Pas d'équipe en avatars : les assignés sont sur les tâches, que le
// portail n'expose délibérément pas (vocabulaire interne, estimations,
// commentaires écrits sur le projet du client). Le chef de projet, lui,
// a sa place dans le panneau Relation.
//
// Pas de « santé du projet » ni de score : rien de tel n'est calculé, et
// l'inventer serait la pire des inventions — un jugement sur le travail
// en cours.

function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ProjectStoryCard({ project }: { project: FeaturedProject }) {
  const color = PROJECT_STATUS_COLORS[project.status] ?? "var(--kov-steel)";
  const visiblePhases = project.phases.slice(0, 7);

  return (
    <section className="kov-panel overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="relative min-h-[220px] lg:min-h-[420px]">
          {project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            // Pas d'image de remplacement : une lettre dit « pas de visuel »,
            // une photo générique ferait croire à un rendu du projet.
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center font-display text-6xl"
              style={{ background: "var(--kov-surface-3)", color: "var(--kov-muted)" }}
            >
              {project.name.charAt(0).toUpperCase()}
            </span>
          )}

          {/* Le fondu vers la colonne de texte : pas de bord entre les deux. */}
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(14,16,18,0.2) 0%, transparent 40%, rgba(14,16,18,0.9) 100%)",
            }}
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 hidden lg:block"
            style={{ background: "linear-gradient(90deg, transparent 55%, var(--kov-surface-2) 100%)" }}
          />

          <span className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.3em] text-kov-bone/80">
            Projet principal
          </span>
        </div>

        <div className="p-7 sm:p-9">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest" style={{ color }}>
              {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
            </span>
            <span className="text-[11px] text-kov-concrete">{project.category}</span>
          </div>

          <h2
            className="mt-3 font-display uppercase text-kov-bone"
            style={{ fontSize: "clamp(22px, 2.4vw, 30px)", lineHeight: 1.08, letterSpacing: "-0.02em" }}
          >
            {project.name}
          </h2>

          {project.currentPhase && (
            <p className="mt-4 text-sm text-kov-concrete">
              Étape en cours <span className="text-kov-bone">{project.currentPhase}</span>
            </p>
          )}

          {project.nextDeadline && (
            <p className="mt-1 text-sm text-kov-concrete">
              Prochaine échéance <span className="text-kov-bone">{formatDate(project.nextDeadline)}</span>
            </p>
          )}

          {visiblePhases.length > 0 ? (
            <div className="mt-7">
              <PhaseTimeline phases={visiblePhases} />
              {/* Le pourcentage est relégué : il confirme, il n'annonce pas. */}
              <p className="mt-4 text-[11px] text-kov-concrete tabular-nums">{project.progressPercent} % réalisé</p>
            </div>
          ) : (
            <p className="mt-7 text-sm text-kov-concrete">
              Les étapes de ce projet seront posées par le studio ; elles apparaîtront ici.
            </p>
          )}

          <Link
            href={`/client/projects/${project.id}`}
            className="mt-8 inline-flex h-11 items-center gap-2 border px-5 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red hover:text-kov-red"
            style={{ borderRadius: "var(--radius-pill)", borderColor: "var(--kov-lift-4)" }}
          >
            Ouvrir le projet
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
