import Link from "next/link";
import { Portrait } from "@/components/ui/Portrait";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { formatMoneyPrecise } from "@/lib/pricing/money";

export interface RelationManager {
  fullName: string | null;
  displayTitle: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
}

export interface RelationActivity {
  id: string;
  title: string;
  createdAt: string;
}

// Un seul panneau à la place de trois cartes.
//
// Il y avait « Votre chef de projet », « Facturation » et « Activité
// récente » : trois rectangles encadrés, empilés, de même largeur et de
// même profondeur. L'œil ne pouvait pas les hiérarchiser, et les trois
// bordures découpaient la colonne en tranches.
//
// Ce sont pourtant trois faces d'une même chose : la relation avec le
// studio. Qui vous suit, ce que vous lui devez, ce qu'il a fait. Réunies,
// elles perdent deux bordures et gagnent un titre qui veut dire quelque
// chose.
//
// La séparation interne est un filet, pas un cadre — voir .kov-divide.
export function RelationPanel({
  manager,
  outstandingCents,
  currency,
  activity,
}: {
  manager: RelationManager | null;
  outstandingCents: number;
  currency: string | null;
  activity: RelationActivity[];
}) {
  return (
    <section className="kov-panel kov-portrait-host overflow-hidden">
      <p className="px-6 pt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-kov-concrete">Relation KOV</p>

      <div className="kov-divide mt-5">
        {/* ── Qui vous suit ─────────────────────────────────────────── */}
        <div className="px-6 py-6">
          {manager ? (
            <>
              <div className="flex items-center gap-4">
                <Portrait
                  src={manager.avatarUrl}
                  name={manager.fullName}
                  size={64}
                  isOnline={manager.isOnline}
                />
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-kov-bone">{manager.fullName || "Équipe KOV"}</p>
                  <p className="mt-0.5 truncate text-xs text-kov-concrete">
                    {manager.displayTitle || "Votre interlocuteur"}
                  </p>
                  {/* La disponibilité est une donnée réelle : l'admin la
                      règle lui-même. Aucun « répond en 2 h » inventé. */}
                  <p className="mt-1 text-[11px]" style={{ color: manager.isOnline ? "#3FB27F" : "var(--kov-concrete)" }}>
                    {manager.isOnline ? "Disponible maintenant" : "Absent pour le moment"}
                  </p>
                </div>
              </div>

              <Link
                href="/client/requests"
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 text-xs uppercase tracking-widest text-kov-white transition-colors hover:bg-kov-red-signal"
                style={{ borderRadius: "var(--radius-pill)", background: "var(--kov-red)" }}
              >
                Lui écrire
                <span aria-hidden="true">→</span>
              </Link>
            </>
          ) : (
            <p className="text-sm text-kov-concrete">
              Aucun interlocuteur ne vous est encore assigné. Vous pouvez écrire au studio, votre message arrive à
              l&apos;équipe.
            </p>
          )}
        </div>

        {/* ── Ce que vous devez ─────────────────────────────────────── */}
        <div className="px-6 py-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[10px] uppercase tracking-widest text-kov-concrete">En attente de paiement</p>
            <Link href="/client/invoices" className="text-[10px] uppercase tracking-widest text-kov-red hover:underline">
              Voir →
            </Link>
          </div>
          <p className="mt-2 font-display text-2xl tabular-nums text-kov-bone">
            {formatMoneyPrecise(outstandingCents, currency)}
          </p>
          {outstandingCents === 0 && <p className="mt-1 text-xs text-kov-concrete">Rien à régler.</p>}
        </div>

        {/* ── Ce qu'il s'est passé ──────────────────────────────────── */}
        <div className="px-6 py-6">
          <p className="text-[10px] uppercase tracking-widest text-kov-concrete">Derniers évènements</p>

          {activity.length === 0 ? (
            <p className="mt-3 text-sm text-kov-concrete">
              Rien pour l&apos;instant. Ce fil se remplit au fil du travail du studio.
            </p>
          ) : (
            <ol className="mt-4 space-y-0">
              {activity.slice(0, 5).map((item, index, all) => (
                <li key={item.id} className="kov-enter flex gap-3">
                  <div className="flex shrink-0 flex-col items-center">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 block h-1.5 w-1.5 rounded-full"
                      style={{ background: index === 0 ? "var(--kov-red)" : "var(--kov-muted)" }}
                    />
                    {index < all.length - 1 && (
                      <span aria-hidden="true" className="my-1 w-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                    )}
                  </div>
                  <div className={`min-w-0 ${index < all.length - 1 ? "pb-4" : ""}`}>
                    <p className="text-sm leading-snug text-kov-bone">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-kov-concrete">{formatRelativeTime(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
