import Link from "next/link";
import { Portrait } from "@/components/ui/Portrait";
import { KovProgress } from "@/components/ui/KovProgress";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";
import type { ThreadContext } from "@/lib/portal/requests";

// Ce qui entoure la conversation : de quel projet parle-t-on, qui est dans
// la boucle, de quels fichiers est-il question.
//
// ── IL A CHANGÉ DE PLACE, DONC DE FORME ──────────────────────────────
//
// C'était une colonne de droite pleine hauteur, avec trois cartes
// empilées et une bannière d'image de 112 px sur le projet. Il occupe
// maintenant un encadré au bas de la colonne des conversations, dont la
// hauteur est bornée : la même composition y serait illisible, et il
// faudrait défiler pour voir les participants.
//
// La densité change donc en même temps que la place. Les cartes de verre
// disparaissent — l'encadré EST déjà une surface distincte, et emboîter
// une carte dans une carte ne sépare plus rien. Ce sont des filets qui
// séparent les trois sections.
//
// ── LE BLOC QUI NE S'APPELLE PAS COMME DANS LA MAQUETTE ──────────────
//
// La maquette disait « Fichiers partagés récemment ». Ce ne sont pas les
// pièces jointes de cette conversation mais les documents du projet lié,
// donc ils s'appellent « Documents du projet ». Les nommer autrement
// laisserait croire qu'ils ont été envoyés ici.

/** Au-delà, l'encadré pousse la liste des conversations hors de l'écran.
 *  Le lien « Voir tous » mène au reste. */
const DOCUMENTS_SHOWN = 3;

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
    <div className="kov-rail">
      {project ? (
        <Link href={projectHref(project.id)} className="kov-rail__section group block">
          <span className="flex items-center gap-3">
            <span className="kov-rail__thumb">
              {project.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden="true" className="font-display text-kov-muted text-sm">
                  {project.name.charAt(0).toUpperCase()}
                </span>
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="text-kov-concrete block text-[10px] tracking-widest uppercase">Projet lié</span>
              <span className="text-kov-bone group-hover:text-kov-red mt-0.5 block truncate text-sm transition-colors">
                {project.name}
              </span>
            </span>

            <span className="text-kov-bone shrink-0 text-xs tabular-nums">{project.progressPercent} %</span>
          </span>

          <span className="mt-2.5 block">
            <KovProgress
              percent={project.progressPercent}
              color={PROJECT_STATUS_COLORS[project.status] ?? "var(--kov-red)"}
              label={`Avancement de ${project.name}`}
            />
          </span>

          <span className="text-kov-concrete mt-1.5 block truncate text-[11px]">
            {PROJECT_STATUS_LABELS[project.status as ProjectStatus] ?? project.status}
            {project.currentPhase && ` · ${project.currentPhase}`}
          </span>
        </Link>
      ) : (
        <div className="kov-rail__section">
          <p className="text-kov-concrete text-[10px] tracking-widest uppercase">Projet lié</p>
          <p className="text-kov-concrete mt-1.5 text-[13px]">
            Cette conversation n&apos;est rattachée à aucun projet.
          </p>
        </div>
      )}

      <div className="kov-rail__section kov-portrait-host">
        <p className="text-kov-concrete text-[10px] tracking-widest uppercase">
          Participants ({participants.length})
        </p>
        <ul className="mt-2.5 space-y-2">
          {participants.map((participant) => (
            <li key={participant.id} className="flex items-center gap-2.5">
              <Portrait src={participant.avatarUrl} name={participant.name} size={26} />
              <span className="min-w-0">
                <span className="text-kov-bone block truncate text-[13px]">{participant.name}</span>
                <span className="text-kov-concrete block truncate text-[11px]">{participant.role}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {documents.length > 0 && (
        <div className="kov-rail__section">
          <div className="flex items-center justify-between gap-3">
            <p className="text-kov-concrete text-[10px] tracking-widest uppercase">Documents du projet</p>
            <Link href={documentsHref} className="text-kov-red text-[10px] tracking-widest uppercase hover:underline">
              Voir tous →
            </Link>
          </div>
          <ul className="mt-2.5 space-y-2">
            {documents.slice(0, DOCUMENTS_SHOWN).map((document) => (
              <li key={document.id} className="flex items-center gap-2.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                  className="text-kov-concrete shrink-0"
                >
                  <path d="M7 3h7l5 5v13H7z" />
                  <path d="M14 3v5h5" />
                </svg>
                <span className="min-w-0">
                  <span className="text-kov-bone block truncate text-[13px]">{document.filename}</span>
                  <span className="text-kov-concrete block text-[11px]">{formatRelativeTime(document.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
