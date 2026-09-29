import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import type { AgendaEvent, AgendaKind } from "@/lib/admin/agenda";

// Ce qui tombe, et quand.
//
// Les échéances existaient déjà dans quatre tables et aucun écran ne les
// réunissait. Ce n'est pas un calendrier mensuel : une grille de 30 cases
// dont 7 sont remplies montre surtout du vide. Une liste datée, groupée par
// jour, dit la même chose en occupant la place qu'elle mérite.

const KIND_COLORS: Record<AgendaKind, string> = {
  task: "var(--kov-status-orange)",
  project: "var(--kov-red)",
  phase: "var(--kov-status-blue)",
  quote: "var(--kov-status-purple)",
  invoice: "var(--kov-status-green)",
};

function formatDay(date: string, today: string, tomorrow: string): string {
  if (date === today) return "Aujourd'hui";
  if (date === tomorrow) return "Demain";
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function AgendaCard({ events, windowDays }: { events: AgendaEvent[]; windowDays: number }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().slice(0, 10);

  const overdue = events.filter((event) => event.overdue);
  const upcoming = events.filter((event) => !event.overdue);

  // Groupé par jour : une date répétée sur cinq lignes consécutives est du
  // bruit, et c'est le jour qu'on cherche du regard, pas la ligne.
  const byDay = new Map<string, AgendaEvent[]>();
  for (const event of upcoming) {
    byDay.set(event.date, [...(byDay.get(event.date) ?? []), event]);
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Échéances</p>
        <span className="text-kov-steel text-xs">{windowDays} jours</span>
      </div>

      {events.length === 0 ? (
        <p className="text-kov-steel text-sm">
          Rien d&apos;ici {windowDays} jours. Les dates de tâches, de phases, de validité de devis et
          d&apos;échéance de facture arrivent ici automatiquement.
        </p>
      ) : (
        <div className="space-y-5">
          {overdue.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "var(--kov-red)" }}>
                En retard · {overdue.length}
              </p>
              <ul className="space-y-1.5">
                {overdue.map((event) => (
                  <AgendaRow key={event.id} event={event} showDate />
                ))}
              </ul>
            </div>
          )}

          {Array.from(byDay.entries()).map(([day, items]) => (
            <div key={day}>
              <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">
                {formatDay(day, today, tomorrow)}
              </p>
              <ul className="space-y-1.5">
                {items.map((event) => (
                  <AgendaRow key={event.id} event={event} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function AgendaRow({ event, showDate = false }: { event: AgendaEvent; showDate?: boolean }) {
  return (
    <li>
      <Link href={event.href} className="flex items-start gap-3 py-1.5 group">
        {/* La couleur porte le type. Elle est doublée par le libellé en
            dessous : une information qui ne tient qu'à une couleur est une
            information perdue pour une partie des lecteurs. */}
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
          style={{ background: KIND_COLORS[event.kind] }}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-kov-bone text-sm truncate group-hover:text-kov-red transition-colors">
            {event.label}
          </span>
          <span className="block text-kov-steel text-[11px] mt-0.5">
            {event.detail}
            {showDate && (
              <> · {new Date(`${event.date}T00:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}
