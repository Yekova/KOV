import { formatBp, formatDays, formatEuros } from "@/lib/pricing/money";
import { AlertList } from "./AlertList";
import type { PricingAlert } from "@/lib/pricing/alerts";
import type { PricingResult } from "@/lib/pricing/engine";
import type { PricingSettings } from "@/lib/pricing/types";

// Le récapitulatif.
//
// Ce que l'écran doit permettre de décider tient en trois questions : à quel
// prix, pour combien de jours, et est-ce que ça gagne de l'argent. Le reste
// est du détail, et il est rangé sous elles.
//
// Deux règles de présentation :
//
// - Une marge négative n'est pas teintée en rouge, elle est ÉCRITE. Une
//   couleur seule se perd à l'impression, sur un écran mal calibré, et pour
//   une partie des lecteurs.
//
// - Aucun chiffre n'apparaît sans son dénominateur quand il en a un. « 4,9 % »
//   seul ne dit rien ; « 4,9 %, soit 369 € sur 16 jours » dit tout.

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-kov-steel text-xs">{label}</span>
      <span className="text-right">
        <span className="text-kov-bone text-sm tabular-nums">{value}</span>
        {hint && <span className="block text-kov-steel text-[11px] tabular-nums">{hint}</span>}
      </span>
    </div>
  );
}

export function PricingSummary({
  result,
  alerts,
  settings,
}: {
  result: PricingResult;
  alerts: PricingAlert[];
  settings: PricingSettings;
}) {
  const hasVat = result.vat.rateBp > 0;
  const marginIsNegative = result.marginCents < 0;
  const marginBelowTarget = result.marginBp !== null && result.marginBp < settings.targetMarginBp;

  const roleDays = Object.entries(result.daysByRole).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-kov-steel text-[11px] uppercase tracking-widest">
          {result.vat.emphasiseInclVat ? "Prix TTC" : "Prix HT"}
        </p>
        <p className="font-display text-kov-bone text-3xl tabular-nums mt-1">
          {formatEuros(result.vat.emphasiseInclVat ? result.vat.totalInclVatCents : result.priceExclVatCents)}
        </p>
        {hasVat ? (
          <p className="text-kov-steel text-xs mt-1 tabular-nums">
            {formatEuros(result.priceExclVatCents)} HT + {formatEuros(result.vat.amountCents)} de TVA à{" "}
            {formatBp(result.vat.rateBp)}
          </p>
        ) : (
          <p className="text-kov-steel text-xs mt-1">{result.vat.exemptionMention}</p>
        )}

        {result.discountCents > 0 && (
          <p className="text-kov-steel text-xs mt-1 tabular-nums">
            après {formatBp(result.discountBp)} de remise, soit {formatEuros(result.discountCents)}
          </p>
        )}
        {result.totalUpliftBp > 0 && (
          <p className="text-kov-steel text-xs mt-1">
            majorations appliquées : {formatBp(result.totalUpliftBp)}
            {result.smallProjectApplied && " (petit projet)"}
            {result.urgencyBp > 0 && " (urgence)"}
          </p>
        )}
      </div>

      <div className="border-t pt-4" style={{ borderColor: "var(--kov-border)" }}>
        <Row
          label="Marge projet"
          value={result.marginBp === null ? "—" : formatBp(result.marginBp)}
          hint={formatEuros(result.marginCents)}
        />
        {/* Le diagnostic est écrit, pas suggéré par une teinte. */}
        {marginIsNegative && (
          <p className="text-xs mt-1" style={{ color: "var(--kov-red)" }}>
            Ce projet perd de l&apos;argent : le prix ne couvre pas les{" "}
            {formatEuros(result.productionCostCents)} de coût de production.
          </p>
        )}
        {!marginIsNegative && marginBelowTarget && (
          <p className="text-kov-steel text-xs mt-1">
            Sous la cible de {formatBp(settings.targetMarginBp)}.
          </p>
        )}

        <Row
          label="TJM implicite"
          value={result.impliedDayRateCents === null ? "—" : formatEuros(result.impliedDayRateCents)}
          hint={`coût de revient ${formatEuros(result.costOfSale.dayRateCents)}`}
        />
        <Row label="Jours de production" value={formatDays(result.totalDays)} />
        <Row
          label="Coût de production"
          value={formatEuros(result.productionCostCents)}
          hint={result.externalCostsCents > 0 ? `dont ${formatEuros(result.externalCostsCents)} d'externes` : undefined}
        />
        {result.subcontractedDays > 0 && (
          <Row
            label="Part sous-traitée"
            value={result.subcontractedShareBp === null ? "—" : formatBp(result.subcontractedShareBp)}
            hint={formatDays(result.subcontractedDays)}
          />
        )}
        {result.band && (
          <Row
            label="Position de marché"
            value={result.band.tier ?? "hors bande"}
            hint={
              result.band.belowLowest
                ? "sous la fourchette observée"
                : result.band.aboveHighest
                  ? "au-dessus de la fourchette"
                  : undefined
            }
          />
        )}
        {result.referenceDeviationBp !== null && (
          <Row
            label="Écart à la grille"
            value={formatBp(result.referenceDeviationBp)}
            hint={`référence ${formatEuros(result.referencePriceCents ?? 0)}`}
          />
        )}
      </div>

      {roleDays.length > 0 && (
        <div className="border-t pt-4" style={{ borderColor: "var(--kov-border)" }}>
          <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">Jours par rôle</p>
          <ul className="space-y-1">
            {roleDays.map(([roleCode, days]) => (
              <li key={roleCode} className="flex items-baseline justify-between gap-3">
                <span className="text-kov-concrete text-xs">{roleCode}</span>
                <span className="text-kov-bone text-xs tabular-nums">{formatDays(days)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.schedule.length > 0 && (
        <div className="border-t pt-4" style={{ borderColor: "var(--kov-border)" }}>
          <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">Échéancier</p>
          <ul className="space-y-1">
            {result.schedule.map((entry, index) => (
              <li key={`${entry.label}-${index}`} className="flex items-baseline justify-between gap-3">
                <span className="text-kov-concrete text-xs min-w-0 truncate">{entry.label}</span>
                <span className="text-kov-bone text-xs tabular-nums shrink-0">
                  {formatEuros(entry.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.subscription && (
        <div className="border-t pt-4" style={{ borderColor: "var(--kov-border)" }}>
          <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">Abonnement</p>
          <Row
            label={result.subscription.label}
            value={`${formatEuros(result.subscription.monthlyPriceCents)} / mois`}
            hint={`${formatEuros(result.subscription.annualValueCents)} par an`}
          />
          <Row
            label="Marge mensuelle"
            value={
              result.subscription.monthlyMarginBp === null
                ? "—"
                : formatBp(result.subscription.monthlyMarginBp)
            }
            hint={formatEuros(result.subscription.monthlyMarginCents)}
          />
          {result.subscription.minCommitmentMonths > 0 && (
            <p className="text-kov-steel text-[11px] mt-1">
              Engagement minimal de {result.subscription.minCommitmentMonths} mois.
            </p>
          )}
        </div>
      )}

      <div className="border-t pt-4" style={{ borderColor: "var(--kov-border)" }}>
        <p className="text-kov-steel text-[11px] uppercase tracking-widest mb-2">
          Alertes{alerts.length > 0 && ` · ${alerts.length}`}
        </p>
        <AlertList alerts={alerts} />
      </div>
    </div>
  );
}
