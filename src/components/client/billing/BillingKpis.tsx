import { GlassCard } from "@/components/ui/GlassCard";
import { formatMoneyPrecise } from "@/lib/pricing/money";

// Quatre chiffres, et pas un de plus — tous comptés, aucun estimé.
//
// La règle appliquée partout ici : une carte ne s'affiche pas si son
// chiffre ne veut rien dire. « Réglé ce mois-ci : 0 € » n'est pas une
// information, c'est du remplissage qui apprend à ne plus lire la rangée.
// Et la variation face au mois dernier n'apparaît que s'il y a eu quelque
// chose le mois dernier : « +100 % » face à zéro ne signifie rien.

function Kpi({
  label,
  value,
  hint,
  hintColor,
  accent,
}: {
  label: string;
  value: string;
  hint?: string | null;
  hintColor?: string;
  accent: string;
}) {
  return (
    <GlassCard className="p-5">
      <p className="text-[11px] uppercase tracking-widest text-kov-concrete">{label}</p>
      <p className="mt-2 font-display text-2xl tabular-nums" style={{ color: accent }}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs" style={{ color: hintColor ?? "var(--kov-concrete)" }}>
          {hint}
        </p>
      )}
    </GlassCard>
  );
}

export function BillingKpis({
  quotesToSign,
  invoicesToPay,
  outstandingCents,
  paidThisMonthCents,
  paidLastMonthCents,
  currency,
}: {
  quotesToSign: number;
  invoicesToPay: number;
  outstandingCents: number;
  paidThisMonthCents: number;
  paidLastMonthCents: number;
  currency: string;
}) {
  const delta =
    paidLastMonthCents > 0 ? Math.round(((paidThisMonthCents - paidLastMonthCents) / paidLastMonthCents) * 100) : null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Kpi
        label="Devis à signer"
        value={String(quotesToSign)}
        accent={quotesToSign > 0 ? "var(--kov-status-orange)" : "var(--kov-bone)"}
        hint={quotesToSign === 0 ? "Rien en attente" : null}
      />
      <Kpi
        label="Factures à régler"
        value={String(invoicesToPay)}
        accent={invoicesToPay > 0 ? "var(--kov-red)" : "var(--kov-bone)"}
        hint={invoicesToPay === 0 ? "Tout est à jour" : null}
      />
      <Kpi
        label="En attente de paiement"
        value={formatMoneyPrecise(outstandingCents, currency)}
        accent="var(--kov-bone)"
        hint={outstandingCents === 0 ? "Aucun solde ouvert" : null}
      />
      <Kpi
        label="Réglé ce mois-ci"
        value={formatMoneyPrecise(paidThisMonthCents, currency)}
        accent="var(--kov-bone)"
        hint={delta === null ? null : `${delta >= 0 ? "+" : ""}${delta} % vs mois dernier`}
        hintColor={delta === null ? undefined : delta >= 0 ? "var(--kov-status-green)" : "var(--kov-concrete)"}
      />
    </div>
  );
}
