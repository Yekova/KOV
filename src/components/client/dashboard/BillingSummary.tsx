import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatMoneyPrecise } from "@/lib/pricing/money";

export type BillingRow = {
  id: string;
  reference: string;
  amountCents: number;
  currency: string | null;
  label: string;
  color: string;
};

// Le résumé de facturation.
//
// Le total en attente est une somme, pas une estimation : les factures
// envoyées et non payées, au centime. La comparaison avec le mois dernier
// vient de invoices.paid_at, qui existe depuis la migration
// 20260819110200 — donc c'est un fait, pas une tendance devinée.
//
// La ligne de comparaison ne s'affiche QUE s'il y a eu quelque chose le
// mois dernier : « +100 % » face à zéro ne veut rien dire, et « — » face à
// zéro non plus.
export function BillingSummary({
  outstandingCents,
  currency,
  paidThisMonthCents,
  paidLastMonthCents,
  rows,
}: {
  outstandingCents: number;
  currency: string | null;
  paidThisMonthCents: number;
  paidLastMonthCents: number;
  rows: BillingRow[];
}) {
  const delta =
    paidLastMonthCents > 0 ? Math.round(((paidThisMonthCents - paidLastMonthCents) / paidLastMonthCents) * 100) : null;

  return (
    <GlassCard className="flex flex-col p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xs uppercase tracking-widest text-kov-concrete">Facturation</h2>
        <Link href="/client/invoices" className="text-xs uppercase tracking-widest text-kov-red hover:underline">
          Voir tout →
        </Link>
      </div>

      <p className="font-display text-2xl text-kov-bone tabular-nums">
        {formatMoneyPrecise(outstandingCents, currency)}
      </p>
      <p className="mt-1 text-xs text-kov-concrete">
        {outstandingCents > 0 ? "Total en attente de paiement" : "Rien en attente de paiement"}
      </p>

      {paidThisMonthCents > 0 && (
        <p className="mt-3 text-xs text-kov-concrete">
          Réglé ce mois-ci :{" "}
          <span className="text-kov-bone tabular-nums">{formatMoneyPrecise(paidThisMonthCents, currency)}</span>
          {delta !== null && (
            <span style={{ color: delta >= 0 ? "#3FB27F" : "var(--kov-concrete)" }}>
              {" "}
              ({delta >= 0 ? "+" : ""}
              {delta} % vs mois dernier)
            </span>
          )}
        </p>
      )}

      {rows.length > 0 && (
        <ul className="mt-5 space-y-1">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0"
              style={{ borderColor: "var(--kov-border)" }}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-kov-bone">{row.reference}</span>
                <span className="block text-xs" style={{ color: row.color }}>
                  {row.label}
                </span>
              </span>
              <span className="shrink-0 text-sm text-kov-bone tabular-nums">
                {formatMoneyPrecise(row.amountCents, row.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
