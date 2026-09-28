import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Portrait } from "@/components/ui/Portrait";
import { KovProgress } from "@/components/ui/KovProgress";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";
import type { ThreadContext } from "@/lib/portal/requests";

// La colonne de droite : ce qui entoure la conversation.
//
// Trois blocs, et chacun répond à une question qu'on se pose en lisant un
// fil : de quel projet parle-t-on, qui est dans la boucle, et de quels
// fichiers est-il question.
//
// ── LE BLOC QUI NE S'APPELLE PAS COMME DANS LA MAQUETTE ──────────────
//
// La maquette dit « Fichiers partagés récemment ». Ce ne sont pas des
// pièces jointes à cette conversation : request_messages n'a qu'un corps
// de texte et aucune table de pièce jointe n'existe. Ce sont les
// documents du projet lié, donc ils s'appellent « Documents du projet ».
// Les nommer autrement laisserait croire qu'ils ont été envoyés ici.

export function ThreadRail({
  context,
  projectHref,
  documentsHref,
}: {
  context: ThreadContext;
  /** Diffère selon le côté : /client/projects/… ou /admin/projects/… */
  projectHref: (projectId: string) => string;
  documentsHref: string;
}) {
  const { project, participants, documents } = context;

  return (
    <div className="space-y-5">
      {project ? (
        <GlassCard className="kov-lift overflow-hidden">
          <Link href={projectHref(project.id)} className="group block">
            <span className="relative block h-28 w-full overflow-hidden" style={{ background: "var(--kov-graphite)" }}>
              {project.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-full w-full items-center justify-center font-display text-2xl text-kov-muted"
                >
                  {project.name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>

            <span className="block p-5">
              <span className="block text-[10px] uppercase tracking-widest text-kov-concrete">
                Projet lié à cette conversation
              </span>
              <span className="mt-2 block truncate text-[15px] text-kov-bone transition-colors group-hover:text-kov-red">
                {project.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-kov-concrete">{project.category}</span>

              <span className="mt-4 flex items-center gap-3">
                <span className="block flex-1">
                  <KovProgress
                    percent={project.progressPercent}
                    color={PROJECT_STATUS_COLORS[project.status] ?? "var(--kov-red)"}
                    label={`Avancement de ${project.name}`}
                  />
                </span>
                <span className="shrink-0 text-xs tabular-nums text-kov-bone">{project.progressPercent} %</span>
              </span>

              <span className="mt-2 block text-xs text-kov-concrete">
                {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
                {project.currentPhase && ` · ${project.currentPhase}`}
              </span>
            </span>
          </Link>
        </GlassCard>
      ) : (
        <GlassCard className="p-5">
          <p className="text-[10px] uppercase tracking-widest text-kov-concrete">Projet lié</p>
          <p className="mt-2 text-sm text-kov-concrete">
            Cette conversation n&apos;est rattachée à aucun projet.
          </p>
        </GlassCard>
      )}

      <GlassCard className="kov-portrait-host p-5">
        <p className="text-[10px] uppercase tracking-widest text-kov-concrete">
          Participants ({participants.length})
        </p>
        <ul className="mt-4 space-y-3">
          {participants.map((participant) => (
            <li key={participant.id} className="flex items-center gap-3">
              <Portrait src={participant.avatarUrl} name={participant.name} size={32} />
              <span className="min-w-0">
                <span className="block truncate text-sm text-kov-bone">{participant.name}</span>
                <span className="block truncate text-xs text-kov-concrete">{participant.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>

      {documents.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-widest text-kov-concrete">Documents du projet</p>
            <Link href={documentsHref} className="text-[10px] uppercase tracking-widest text-kov-red hover:underline">
              Voir tous →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center gap-3">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                  className="shrink-0 text-kov-concrete"
                >
                  <path d="M7 3h7l5 5v13H7z" />
                  <path d="M14 3v5h5" />
                </svg>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-kov-bone">{document.filename}</span>
                  <span className="block text-xs text-kov-concrete">{formatRelativeTime(document.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
