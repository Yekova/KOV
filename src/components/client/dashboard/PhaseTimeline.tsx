export interface TimelinePhase {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
}

// Les étapes, en frise — pas un pourcentage.
//
// « 72 % » ne dit pas où en est un projet : ça dit qu'un calcul a été fait.
// « Design terminé, Développement en cours, Recette à venir » le dit. Le
// pourcentage reste, en second plan, pour ceux qui veulent un chiffre.
//
// ── PAS DE R0 / R1 / R4 ──────────────────────────────────────────────
//
// Le brief propose une notation par repères numérotés. C'est du vocabulaire
// interne : le client n'a aucune raison de savoir que « Développer » est
// la quatrième phase. Les phases ont de vrais noms en base, ce sont eux
// qui s'affichent.
//
// Trois états seulement, et leurs couleurs sont celles du reste de
// l'espace : vert pour fait, rouge pour en cours, gris pour à venir.

const DONE = "var(--kov-status-green)";
const FUTURE = "var(--kov-muted)";

function stateOf(status: string): "done" | "current" | "future" {
  if (status === "completed") return "done";
  if (status === "in_progress" || status === "review") return "current";
  return "future";
}

function formatDay(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function PhaseTimeline({ phases }: { phases: TimelinePhase[] }) {
  if (phases.length === 0) return null;

  return (
    <ol className="space-y-0">
      {phases.map((phase, index) => {
        const state = stateOf(phase.status);
        const color = state === "done" ? DONE : state === "current" ? "var(--kov-red)" : FUTURE;
        const isLast = index === phases.length - 1;

        return (
          <li key={phase.id} className="flex gap-3">
            <div className="flex shrink-0 flex-col items-center">
              {/* Le point plein pour ce qui est fait, l'anneau pour ce qui
                  est en cours, le point creux pour la suite : la forme dit
                  l'état autant que la couleur. */}
              <span
                aria-hidden="true"
                className="mt-1.5 block h-2.5 w-2.5 rounded-full"
                style={{
                  background: state === "current" ? "transparent" : color,
                  border: state === "current" ? `2px solid ${color}` : undefined,
                  opacity: state === "future" ? 0.7 : 1,
                }}
              />
              {!isLast && <span aria-hidden="true" className="my-1 w-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />}
            </div>

            <div className={`min-w-0 ${isLast ? "" : "pb-4"}`}>
              <p
                className="truncate text-sm"
                style={{ color: state === "future" ? "var(--kov-concrete)" : "var(--kov-bone)" }}
              >
                {phase.name}
              </p>
              <p className="mt-0.5 text-[11px]" style={{ color: state === "current" ? "var(--kov-red)" : "var(--kov-concrete)" }}>
                {state === "done" ? "Terminée" : state === "current" ? "En cours" : "À venir"}
                {phase.dueDate && ` · ${formatDay(phase.dueDate)}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
