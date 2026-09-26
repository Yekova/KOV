import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

// Ce que le client doit faire, au-dessus de la ligne de flottaison.
//
// Un devis envoyé et non signé est l'objet le plus important du portail, et
// il était à un clic d'une page que personne n'ouvre spontanément. Une
// facture en retard s'apprenait de la même façon : en allant la chercher.
//
// La carte ne s'affiche que s'il y a réellement quelque chose à faire.
// Un bandeau permanent qui dit « rien à signaler » apprend à ne plus être
// lu, et emporte avec lui le jour où il dit autre chose.

export interface ActionItem {
  id: string;
  label: string;
  detail: string;
  href: string;
  urgent?: boolean;
}

export function ActionRequiredCard({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null;

  return (
    <GlassCard className="p-6">
      <p className="text-xs uppercase tracking-widest text-kov-red mb-4">
        {items.length === 1 ? "Une action vous attend" : `${items.length} actions vous attendent`}
      </p>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-4 border px-4 py-3 transition-colors hover:border-kov-red group"
              style={{
                borderColor: item.urgent ? "rgba(227,30,36,0.4)" : "var(--kov-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span className="min-w-0">
                <span className="block text-kov-bone text-sm">{item.label}</span>
                <span className="block text-kov-steel text-xs mt-0.5">{item.detail}</span>
              </span>
              <span className="text-kov-red shrink-0 transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
