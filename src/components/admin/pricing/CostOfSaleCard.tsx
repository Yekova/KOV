import { GlassCard } from "@/components/ui/GlassCard";
import { formatEuros } from "@/lib/pricing/money";
import type { CostOfSale } from "@/lib/pricing/costOfSale";
import type { PricingSettings } from "@/lib/pricing/types";

// Le coût de revient, avec sa formule à côté du résultat.
//
// C'est le chiffre le plus important du module et le seul dont une erreur ne
// se verrait pas : un taux de vente faux saute aux yeux sur un devis, un coût
// de revient faux ne se remarque qu'à la fin de l'année. Afficher « 301 € »
// seul demanderait de faire confiance. Afficher le calcul permet de vérifier.

function formatPercent(bp: number): string {
  return `${(bp / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

export function CostOfSaleCard({ settings, cost }: { settings: PricingSettings; cost: CostOfSale }) {
  const isMicro = settings.regime === "micro";

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <p className="text-xs uppercase tracking-widest text-kov-steel">Coût de revient</p>
        <span className="text-kov-steel text-xs">
          {isMicro ? "Micro-entreprise" : "Société à l'IS"} · {settings.label}
        </span>
      </div>

      <p className="font-display text-kov-bone text-3xl tabular-nums">
        {formatEuros(cost.dayRateCents)}
        <span className="text-kov-steel text-base font-sans"> par jour</span>
      </p>

      <div className="mt-5 pt-5 border-t space-y-2" style={{ borderColor: "var(--kov-border)" }}>
        <p className="text-kov-steel text-[11px] uppercase tracking-widest">Le calcul</p>

        {isMicro ? (
          <>
            {/* Les cotisations micro s'assoient sur le chiffre d'affaires :
                elles rétrécissent le dénominateur au lieu de gonfler le
                numérateur. C'est le piège de ce calcul, et l'écrire évite
                qu'on le « corrige » plus tard. */}
            <p className="text-kov-concrete text-sm tabular-nums">
              ({formatEuros(settings.targetNetIncomeCents)} de revenu net visé +{" "}
              {formatEuros(settings.fixedCostsCents)} de charges fixes + {formatEuros(settings.depreciationCents)}{" "}
              d&apos;amortissements)
            </p>
            <p className="text-kov-concrete text-sm tabular-nums">
              ÷ ({settings.billableDays} jours facturables × (1 − {formatPercent(settings.contributionRateBp)} de
              cotisations))
            </p>
            <p className="text-kov-steel text-xs pt-1">
              Les cotisations du régime micro s&apos;assoient sur le chiffre d&apos;affaires, pas sur la
              rémunération : facturer un jour de plus en coûte davantage. Elles réduisent donc les jours utiles
              au lieu de s&apos;ajouter aux charges.
            </p>
          </>
        ) : (
          <>
            <p className="text-kov-concrete text-sm tabular-nums">
              ({formatEuros(settings.targetNetIncomeCents)} de rémunération nette × (1 +{" "}
              {formatPercent(settings.contributionRateBp)} de cotisations) + {formatEuros(settings.fixedCostsCents)}{" "}
              de charges fixes + {formatEuros(settings.depreciationCents)} d&apos;amortissements)
            </p>
            <p className="text-kov-concrete text-sm tabular-nums">÷ {settings.billableDays} jours facturables</p>
            <p className="text-kov-steel text-xs pt-1">
              Soit {formatEuros(cost.annualBurdenCents)} à couvrir dans l&apos;année.
            </p>
          </>
        )}
      </div>

      {!cost.confirmed && (
        <div
          className="mt-5 px-4 py-3 border text-sm"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          <p className="text-kov-bone">Taux de cotisations non confirmé</p>
          <p className="text-kov-steel text-xs mt-1">
            Le taux de {formatPercent(settings.contributionRateBp)} n&apos;a pas été validé par un
            expert-comptable. Le coût ci-dessus en dépend directement, ainsi que les alertes qui bloquent la
            génération d&apos;un devis.
          </p>
        </div>
      )}
    </GlassCard>
  );
}
