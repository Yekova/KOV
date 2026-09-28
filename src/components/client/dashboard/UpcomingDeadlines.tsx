import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export type Deadline = {
  id: string;
  /** Date ISO courte (AAAA-MM-JJ). */
  date: string;
  label: string;
  projectId: string;
  projectName: string;
  /** Vrai quand la date est passée et que l'étape n'est pas terminée. */
  overdue: boolean;
};

// Les prochaines échéances.
//
// Elles existaient en base depuis le début — projects.next_deadline_date et
// project_phases.due_date — et une seule était affichée, dans une carte qui
// dessinait une semaine de calendrier autour d'elle. Une semaine de sept
// cases pour une seule date, c'était beaucoup de dessin pour une
// information.
//
// La carte n'invente aucune date : elle ne montre que celles qui sont
// écrites, et ne s'affiche pas du tout quand il n'y en a aucune. Un
// calendrier vide apprend à ne plus être regardé.

const MONTHS = ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];

export function UpcomingDeadlines({ deadlines }: { deadlines: Deadline[] }) {
  return (
    <GlassCard className="flex flex-col p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xs uppercase tracking-widest text-kov-concrete">Prochaines échéances</h2>
      </div>

      {deadlines.length === 0 ? (
        <p className="text-sm text-kov-concrete">
          Aucune échéance datée pour l&apos;instant. Le studio en pose au fil des phases.
        </p>
      ) : (
        <ul className="space-y-4">
          {deadlines.map((deadline) => {
            const date = new Date(`${deadline.date}T00:00:00`);
            return (
              <li key={deadline.id}>
                <Link
                  href={`/client/projects/${deadline.projectId}`}
                  className="group flex items-center gap-4 transition-colors"
                >
                  {/* La pastille de date : le jour en gros, le mois en petit.
                      C'est ce qu'on lit d'un calendrier sans le lire. */}
                  <span
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center"
                    style={{
                      background: "var(--kov-graphite)",
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${deadline.overdue ? "rgba(227,30,36,0.45)" : "var(--kov-border)"}`,
                    }}
                  >
                    <span className="font-display text-base leading-none text-kov-bone tabular-nums">
                      {date.getDate()}
                    </span>
                    <span className="mt-0.5 font-mono text-[9px] tracking-widest text-kov-concrete">
                      {MONTHS[date.getMonth()]}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-kov-bone transition-colors group-hover:text-kov-red">
                      {deadline.label}
                    </span>
                    <span className="block truncate text-xs text-kov-concrete">{deadline.projectName}</span>
                  </span>

                  {/* Le mot, pas seulement la bordure rouge. */}
                  {deadline.overdue && (
                    <span className="shrink-0 text-[10px] uppercase tracking-widest" style={{ color: "var(--kov-red)" }}>
                      Dépassée
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
