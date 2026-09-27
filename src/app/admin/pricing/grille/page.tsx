import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { getPricingCatalog, getDefaultSettingsVersionId, listSettingsVersions } from "@/lib/pricing/catalog";
import { computeCostOfSale } from "@/lib/pricing/costOfSale";
import { priceConfiguration } from "@/lib/pricing/engine";
import { formatBp, formatDays, formatEuros } from "@/lib/pricing/money";
import { getRound } from "@/lib/pricing/rounds";
import type { PricingCatalog, PricingConditions, PricingSelection } from "@/lib/pricing/types";

export const metadata: Metadata = { title: "La grille — Admin KOV" };

// La grille, confrontée à elle-même.
//
// Chaque offre est chiffrée avec sa composition par défaut, puis comparée à
// son prix de référence et à la marge cible. C'est le contrôle que la spec
// demande en test automatique (§7.1), rendu visible : un test qui passe ne
// dit pas de combien il passe, et c'est justement ce qu'on veut savoir quand
// on se demande si un taux peut bouger.

const NEUTRAL_CONDITIONS: PricingConditions = {
  discountBp: 0,
  discountReason: null,
  validityDays: 30,
  leadTimeLabel: null,
  displayMode: "round",
  schedule: null,
};

function defaultSelection(catalog: PricingCatalog, offerKey: string): PricingSelection {
  return {
    offerKey,
    modules: (catalog.defaultModulesByOffer[offerKey] ?? []).map((entry) => ({
      moduleKey: entry.moduleKey,
      quantity: entry.quantity,
      subcontractedRoles: [],
    })),
    options: [],
    subscriptionKey: null,
    complexity: "standard",
    urgency: "normal",
    clientVatRegime: "liable",
  };
}

export default async function PricingGridPage({
  searchParams,
}: {
  searchParams: Promise<{ version?: string }>;
}) {
  await requireAdmin();
  const { version } = await searchParams;

  const versions = await listSettingsVersions();
  const activeId = version && versions.some((v) => v.id === version) ? version : await getDefaultSettingsVersionId();
  const catalog = activeId ? await getPricingCatalog(activeId) : null;

  if (!catalog || !activeId) {
    return (
      <main className="px-6 py-10 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-kov-bone text-2xl uppercase">La grille</h1>
        <p className="text-kov-steel text-sm mt-4">
          Aucune version tarifaire n&apos;est chargée. Les migrations du module de pricing n&apos;ont pas encore
          été appliquées.
        </p>
      </main>
    );
  }

  const cost = computeCostOfSale(catalog.settings);
  const rows = catalog.offers
    .filter((offer) => (catalog.defaultModulesByOffer[offer.key] ?? []).length > 0)
    .map((offer) => ({
      offer,
      result: priceConfiguration(catalog, defaultSelection(catalog, offer.key), NEUTRAL_CONDITIONS),
    }));

  const belowTarget = rows.filter(
    (row) => row.result.marginBp !== null && row.result.marginBp < catalog.settings.targetMarginBp
  );

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div>
        <Link
          href="/admin/pricing"
          className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
        >
          ← Pricing
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">La grille</h1>
        <p className="text-kov-steel text-sm mt-1">
          Chaque offre chiffrée avec sa composition par défaut, aux paramètres « {catalog.settings.label} ».
          Coût de revient retenu : {formatEuros(cost.dayRateCents)} par jour.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {versions.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <Link
              key={entry.id}
              href={`/admin/pricing/grille?version=${entry.id}`}
              className="px-4 py-2 border text-xs uppercase tracking-widest transition-colors"
              style={{
                borderColor: isActive ? "var(--kov-red)" : "var(--kov-border)",
                borderRadius: "var(--radius-sm)",
                color: isActive ? "var(--kov-red)" : undefined,
              }}
            >
              {entry.label}
            </Link>
          );
        })}
      </div>

      {/* Le constat d'ensemble, avant le détail. C'est l'information qu'on
          vient chercher : combien d'offres ne tiennent pas la marge cible. */}
      {belowTarget.length > 0 && (
        <GlassCard className="p-6">
          <p className="text-kov-bone text-sm">
            {belowTarget.length} offre{belowTarget.length > 1 ? "s" : ""} sur {rows.length} passe
            {belowTarget.length > 1 ? "nt" : ""} sous la marge cible de {formatBp(catalog.settings.targetMarginBp)} :{" "}
            {belowTarget.map((row) => row.offer.label).join(", ")}.
          </p>
          <p className="text-kov-steel text-xs mt-2">
            Le coût de revient et l&apos;indexation ne bougent pas au même rythme. Les prix de référence de la
            grille sont indexés avec les taux, donc l&apos;écart affiché ci-dessous ne vient pas de
            l&apos;indexation : il vient de la composition.
          </p>
        </GlassCard>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[56rem]">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--kov-border)" }}>
              <th className="text-left py-3 pr-4 text-kov-steel text-[11px] uppercase tracking-widest font-normal">Offre</th>
              <th className="text-right py-3 px-3 text-kov-steel text-[11px] uppercase tracking-widest font-normal">Jours</th>
              <th className="text-right py-3 px-3 text-kov-steel text-[11px] uppercase tracking-widest font-normal">Prix HT</th>
              <th className="text-right py-3 px-3 text-kov-steel text-[11px] uppercase tracking-widest font-normal">Référence</th>
              <th className="text-right py-3 px-3 text-kov-steel text-[11px] uppercase tracking-widest font-normal">Écart</th>
              <th className="text-right py-3 px-3 text-kov-steel text-[11px] uppercase tracking-widest font-normal">TJM</th>
              <th className="text-right py-3 px-3 text-kov-steel text-[11px] uppercase tracking-widest font-normal">Marge</th>
              <th className="text-left py-3 pl-3 text-kov-steel text-[11px] uppercase tracking-widest font-normal">Bande</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ offer, result }) => {
              const deviation = result.referenceDeviationBp;
              const overGrid = deviation !== null && Math.abs(deviation) > catalog.settings.gridDeviationBp;
              const underMargin =
                result.marginBp !== null && result.marginBp < catalog.settings.targetMarginBp;
              const underCost =
                result.impliedDayRateCents !== null && result.impliedDayRateCents < cost.dayRateCents;

              return (
                <tr key={offer.key} className="border-b" style={{ borderColor: "var(--kov-border)" }}>
                  <td className="py-3 pr-4">
                    <p className="text-kov-bone">{offer.label}</p>
                    <p className="text-kov-steel text-[11px] mt-0.5">
                      {(catalog.defaultModulesByOffer[offer.key] ?? []).length} modules ·{" "}
                      {offer.leadTimeLabel ?? "délai non renseigné"}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-right text-kov-concrete tabular-nums">{formatDays(result.totalDays)}</td>
                  <td className="py-3 px-3 text-right text-kov-bone tabular-nums">
                    {formatEuros(result.priceExclVatCents)}
                    {result.smallProjectApplied && (
                      <span className="block text-kov-steel text-[11px]">petit projet +{formatBp(result.smallProjectBp)}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right text-kov-concrete tabular-nums">
                    {result.referencePriceCents === null ? "—" : formatEuros(result.referencePriceCents)}
                  </td>
                  <td
                    className="py-3 px-3 text-right tabular-nums"
                    style={{ color: overGrid ? "var(--kov-red)" : undefined }}
                  >
                    {deviation === null ? "—" : formatBp(deviation)}
                  </td>
                  <td
                    className="py-3 px-3 text-right tabular-nums"
                    style={{ color: underCost ? "var(--kov-red)" : undefined }}
                  >
                    {result.impliedDayRateCents === null ? "—" : formatEuros(result.impliedDayRateCents)}
                  </td>
                  <td
                    className="py-3 px-3 text-right tabular-nums"
                    style={{ color: underMargin ? "var(--kov-red)" : undefined }}
                  >
                    {result.marginBp === null ? "—" : formatBp(result.marginBp)}
                    <span className="block text-kov-steel text-[11px]">{formatEuros(result.marginCents)}</span>
                  </td>
                  <td className="py-3 pl-3 text-kov-concrete">
                    {result.band?.tier ?? "—"}
                    {result.band?.belowLowest && <span className="block text-kov-steel text-[11px]">sous la bande</span>}
                    {result.band?.aboveHighest && <span className="block text-kov-steel text-[11px]">au-dessus</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-kov-steel text-xs">
        L&apos;écart est mesuré contre le prix de référence indexé, pas contre sa valeur de base : sans cela, il
        se déclencherait sur toutes les offres dès la première année d&apos;indexation, sans qu&apos;aucune
        composition n&apos;ait bougé. Le seuil est de {formatBp(catalog.settings.gridDeviationBp)}.
      </p>

      {/* Le détail par offre : c'est là qu'on va voir d'où vient un écart. */}
      <div className="space-y-6">
        {rows.map(({ offer, result }) => (
          <GlassCard key={offer.key} className="p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <p className="text-kov-bone">{offer.label}</p>
              <span className="text-kov-steel text-xs tabular-nums">
                {formatDays(result.totalDays)} · {formatEuros(result.priceExclVatCents)} HT
                {result.externalCostsCents > 0 && <> · {formatEuros(result.externalCostsCents)} de coûts externes</>}
              </span>
            </div>

            <ul className="space-y-1.5">
              {result.lines.map((line) => (
                <li key={line.moduleKey} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="text-kov-steel text-[11px] uppercase tracking-widest w-28 shrink-0">
                    {line.roundSpanLabel ?? getRound(line.roundCode).label}
                  </span>
                  <span className="text-kov-concrete flex-1 min-w-0">{line.label}</span>
                  <span className="text-kov-steel text-xs tabular-nums">
                    {line.roles.map((role) => `${role.roleCode} ${formatDays(role.days)}`).join(" · ")}
                  </span>
                  <span className="text-kov-bone text-sm tabular-nums w-24 text-right">
                    {formatEuros(line.sellCents)}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="mt-4 pt-4 border-t grid gap-3 sm:grid-cols-3 text-xs"
              style={{ borderColor: "var(--kov-border)" }}
            >
              <p className="text-kov-steel">
                Échéancier :{" "}
                {result.schedule.map((entry) => `${entry.label} ${formatEuros(entry.amountCents)}`).join(" · ")}
              </p>
              <p className="text-kov-steel">
                Coût de production {formatEuros(result.productionCostCents)}
              </p>
              {offer.contingencyBp > 0 && (
                <p className="text-kov-steel">
                  Aléa recommandé {formatBp(offer.contingencyBp)}, soit {formatEuros(result.contingencyCents)}. Jamais
                  appliqué automatiquement.
                </p>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </main>
  );
}
