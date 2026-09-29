import type { AlertLevel, PricingAlert } from "@/lib/pricing/alerts";

// Les alertes, rangées par conséquence.
//
// Le niveau est doublé par un mot, jamais porté par la seule couleur : une
// information qui ne tient qu'à une teinte est perdue pour une partie des
// lecteurs, et ici elle décide si un devis peut partir.

const LEVEL_LABELS: Record<AlertLevel, string> = {
  blocking: "Bloquant",
  warning: "Avertissement",
  info: "Information",
};

const LEVEL_COLORS: Record<AlertLevel, string> = {
  blocking: "var(--kov-red)",
  warning: "var(--kov-status-orange)",
  info: "var(--kov-steel)",
};

const ORDER: AlertLevel[] = ["blocking", "warning", "info"];

export function AlertList({ alerts, compact = false }: { alerts: PricingAlert[]; compact?: boolean }) {
  if (alerts.length === 0) {
    return (
      <p className="text-kov-steel text-xs">
        Aucune alerte. Le prix couvre son coût, la marge tient la cible et rien ne dépasse les garde-fous.
      </p>
    );
  }

  const sorted = [...alerts].sort((a, b) => ORDER.indexOf(a.level) - ORDER.indexOf(b.level));

  return (
    <ul className="space-y-2.5">
      {sorted.map((alert) => (
        <li
          key={alert.code}
          className="border-l-2 pl-3"
          style={{ borderColor: LEVEL_COLORS[alert.level] }}
        >
          <p className="text-[10px] uppercase tracking-widest" style={{ color: LEVEL_COLORS[alert.level] }}>
            {LEVEL_LABELS[alert.level]}
          </p>
          <p className="text-kov-bone text-xs mt-0.5">{alert.title}</p>
          {!compact && <p className="text-kov-steel text-[11px] mt-1">{alert.detail}</p>}
          {!compact && alert.fix && <p className="text-kov-concrete text-[11px] mt-1">{alert.fix}</p>}
        </li>
      ))}
    </ul>
  );
}
