import { allocate, applyBp, indexCents, roundToStep, shareBp, upliftBp } from "./money.ts";
import { computeCostOfSale, roleCostCents, type CostOfSale } from "./costOfSale.ts";
import { buildSchedule, type ScheduleEntry } from "./schedule.ts";
import { computeVat, type VatResult } from "./vat.ts";
import { compareRounds } from "./rounds.ts";
import type {
  MarketBand,
  MarketTier,
  PricingCatalog,
  PricingConditions,
  PricingSelection,
  RoundCode,
  SelectedModule,
} from "./types.ts";

// Le moteur.
//
// Une fonction, sans effet de bord, qui prend un catalogue, une sélection et
// des conditions, et rend tout ce qu'il y a à savoir sur le prix. Elle ne
// lit rien, n'écrit rien, ne connaît ni React ni Supabase : c'est ce qui la
// rend testable, et c'est ce qui permet de figer son résultat dans un
// instantané pour pouvoir l'expliquer un an plus tard.
//
// ── UNE DÉCISION À CONNAÎTRE ─────────────────────────────────────────────
//
// L'indexation porte sur les PRIX, jamais sur les COÛTS. Les taux de vente,
// les prix de référence, les bandes de marché et les abonnements se
// déplacent avec elle ; les coûts externes, non. Un coût externe est un
// montant réellement payé à quelqu'un : il se met à jour en le corrigeant,
// pas en le multipliant par un coefficient commercial.

export interface PricedRole {
  roleCode: string;
  roleLabel: string;
  days: number;
  sellRateCents: number;
  costRateCents: number;
  subcontracted: boolean;
  sellCents: number;
  costCents: number;
}

export interface PricedLine {
  moduleKey: string;
  label: string;
  roundCode: RoundCode;
  roundSpanLabel: string | null;
  quantity: number;
  quantityUnit: string | null;
  days: number;
  roles: PricedRole[];
  externalCostsCents: number;
  /** Prix de vente brut de la ligne, avant majorations et arrondi projet. */
  sellCents: number;
  costCents: number;
  quoteAssumption: string | null;
}

export interface BandPosition {
  tier: MarketTier | null;
  belowLowest: boolean;
  aboveHighest: boolean;
  bands: MarketBand[];
}

export interface SubscriptionResult {
  key: string;
  label: string;
  monthlyPriceCents: number;
  annualValueCents: number;
  monthlyDays: number;
  monthlyCostCents: number;
  monthlyMarginCents: number;
  monthlyMarginBp: number | null;
  minCommitmentMonths: number;
}

export interface PricingResult {
  lines: PricedLine[];
  /** Chiffrées pour information, jamais additionnées au total. */
  optionLines: PricedLine[];

  totalDays: number;
  daysByRole: Record<string, number>;
  subcontractedDays: number;
  subcontractedShareBp: number | null;

  subtotalCents: number;
  smallProjectApplied: boolean;
  smallProjectBp: number;
  urgencyBp: number;
  totalUpliftBp: number;

  preDiscountCents: number;
  discountBp: number;
  discountCents: number;
  priceExclVatCents: number;

  vat: VatResult;
  schedule: ScheduleEntry[];

  externalCostsCents: number;
  productionCostCents: number;
  marginCents: number;
  marginBp: number | null;
  impliedDayRateCents: number | null;
  costOfSale: CostOfSale;
  contingencyCents: number;

  band: BandPosition | null;
  referencePriceCents: number | null;
  referenceDeviationBp: number | null;

  subscription: SubscriptionResult | null;
}

function priceLine(
  selected: SelectedModule,
  catalog: PricingCatalog,
  complexityBp: number,
  internalDayRateCents: number
): PricedLine | null {
  const definition = catalog.modules.find((m) => m.key === selected.moduleKey);
  if (!definition) return null;

  const { indexationBp } = catalog.settings;
  const quantity = selected.quantity;
  const subcontracted = new Set(selected.subcontractedRoles);

  const roles: PricedRole[] = [];
  for (const [roleCode, baseDays] of Object.entries(definition.roleDays)) {
    const role = catalog.roles.find((r) => r.code === roleCode);
    if (!role) continue;

    // Le coefficient de complexité agit sur les JOURS, pas sur le prix.
    // C'est ce qui le rend honnête : un projet complexe coûte plus cher
    // parce qu'il prend plus de temps, et ce temps se répercute aussi sur
    // le coût de production. Un coefficient appliqué au prix seul aurait
    // gonflé la marge sans qu'aucun travail supplémentaire ne l'explique.
    const days = (baseDays * quantity * complexityBp) / 10_000;
    const isSubcontracted = !role.internalOnly && subcontracted.has(roleCode);
    const sellRateCents = indexCents(role.sellRateCents, indexationBp);
    const costRateCents = roleCostCents(isSubcontracted, role.freelanceCostCents, internalDayRateCents);

    roles.push({
      roleCode,
      roleLabel: role.label,
      days,
      sellRateCents,
      costRateCents,
      subcontracted: isSubcontracted,
      sellCents: Math.round(days * sellRateCents),
      costCents: Math.round(days * costRateCents),
    });
  }

  const externalCostsCents = definition.externalCostsCents * quantity;
  const rolesSell = roles.reduce((sum, role) => sum + role.sellCents, 0);
  const rolesCost = roles.reduce((sum, role) => sum + role.costCents, 0);

  return {
    moduleKey: definition.key,
    label: definition.label,
    roundCode: definition.roundCode,
    roundSpanLabel: definition.roundSpanLabel,
    quantity,
    quantityUnit: definition.quantityUnit,
    days: roles.reduce((sum, role) => sum + role.days, 0),
    roles,
    externalCostsCents,
    sellCents: rolesSell + upliftBp(externalCostsCents, catalog.settings.externalUpliftBp),
    costCents: rolesCost + externalCostsCents,
    quoteAssumption: definition.quoteAssumption,
  };
}

function positionInBands(priceCents: number, bands: MarketBand[], indexationBp: number): BandPosition {
  const indexed = bands.map((band) => ({
    ...band,
    minCents: band.minCents === null ? null : indexCents(band.minCents, indexationBp),
    maxCents: band.maxCents === null ? null : indexCents(band.maxCents, indexationBp),
  }));

  const match = indexed.find(
    (band) =>
      (band.minCents === null || priceCents >= band.minCents) &&
      (band.maxCents === null || priceCents <= band.maxCents)
  );

  const lowest = indexed.reduce<number | null>(
    (min, band) => (band.minCents === null ? min : min === null ? band.minCents : Math.min(min, band.minCents)),
    null
  );
  // Une bande ouverte vers le haut n'a pas de plafond : on ne peut donc pas
  // être « au-dessus » d'elle. C'est le cas de « premium », et c'est voulu.
  const hasOpenBand = indexed.some((band) => band.maxCents === null);
  const highest = indexed.reduce<number | null>(
    (max, band) => (band.maxCents === null ? max : max === null ? band.maxCents : Math.max(max, band.maxCents)),
    null
  );

  return {
    tier: match?.tier ?? null,
    belowLowest: lowest !== null && priceCents < lowest,
    aboveHighest: !hasOpenBand && highest !== null && priceCents > highest,
    bands: indexed,
  };
}

export function priceConfiguration(
  catalog: PricingCatalog,
  selection: PricingSelection,
  conditions: PricingConditions
): PricingResult {
  const { settings } = catalog;
  const costOfSale = computeCostOfSale(settings);
  const complexityBp = settings.complexityBp[selection.complexity];
  const offer = selection.offerKey ? catalog.offers.find((o) => o.key === selection.offerKey) ?? null : null;

  const lines = selection.modules
    .map((selected) => priceLine(selected, catalog, complexityBp, costOfSale.dayRateCents))
    .filter((line): line is PricedLine => line !== null)
    .sort((a, b) => compareRounds(a.roundCode, b.roundCode));

  const optionLines = selection.options
    .map((selected) => priceLine(selected, catalog, complexityBp, costOfSale.dayRateCents))
    .filter((line): line is PricedLine => line !== null)
    .sort((a, b) => compareRounds(a.roundCode, b.roundCode));

  const daysByRole: Record<string, number> = {};
  let subcontractedDays = 0;
  for (const line of lines) {
    for (const role of line.roles) {
      daysByRole[role.roleCode] = (daysByRole[role.roleCode] ?? 0) + role.days;
      if (role.subcontracted) subcontractedDays += role.days;
    }
  }
  const totalDays = Object.values(daysByRole).reduce((sum, days) => sum + days, 0);

  // Les coûts externes de l'offre valent pour tout le projet (licences,
  // polices, banques d'images). Ils entrent dans le sous-total avec la même
  // majoration que ceux d'un module : c'est le même type de dépense, elle ne
  // change pas de nature selon l'endroit où elle est saisie.
  const offerExternalCents = offer?.externalCostsCents ?? 0;
  const modulesExternalCents = lines.reduce((sum, line) => sum + line.externalCostsCents, 0);
  const externalCostsCents = offerExternalCents + modulesExternalCents;

  const subtotalCents =
    lines.reduce((sum, line) => sum + line.sellCents, 0) +
    upliftBp(offerExternalCents, settings.externalUpliftBp);

  const smallProjectApplied = totalDays > 0 && totalDays < settings.smallProjectThresholdDays;
  const smallProjectBpApplied = smallProjectApplied ? settings.smallProjectBp : 0;
  const urgencyBpApplied = settings.urgencyBp[selection.urgency];
  // Les majorations s'additionnent avant d'être appliquées, comme la spec
  // les écrit : « × (1 + majorations) ». Les composer l'une après l'autre
  // donnerait une majoration sur la majoration, que personne n'a demandée.
  const totalUpliftBp = smallProjectBpApplied + urgencyBpApplied;

  const discountBp = conditions.discountBp;
  const upliftedCents = upliftBp(subtotalCents, totalUpliftBp);
  const preDiscountCents = roundToStep(upliftedCents, settings.roundingStepCents);
  // Un seul arrondi, à la fin : arrondir avant la remise puis re-arrondir
  // après ferait apparaître quelques euros qui ne viennent de nulle part.
  const priceExclVatCents = roundToStep(
    applyBp(upliftedCents, 10_000 - discountBp),
    settings.roundingStepCents
  );
  const discountCents = preDiscountCents - priceExclVatCents;

  const productionCostCents = lines.reduce((sum, line) => sum + line.costCents, 0) + offerExternalCents;
  const marginCents = priceExclVatCents - productionCostCents;
  const impliedDayRateCents =
    totalDays > 0 ? Math.round((priceExclVatCents - externalCostsCents) / totalDays) : null;

  const vat = computeVat(priceExclVatCents, settings, selection.clientVatRegime);

  const scheduleTemplate = conditions.schedule ?? offer?.paymentSchedule ?? [];
  const schedule = buildSchedule(vat.totalInclVatCents, scheduleTemplate);

  const bands = offer ? catalog.bandsByOffer[offer.key] ?? [] : [];
  const band = offer && bands.length > 0 ? positionInBands(priceExclVatCents, bands, settings.indexationBp) : null;

  const referencePriceCents =
    offer?.referencePriceCents != null ? indexCents(offer.referencePriceCents, settings.indexationBp) : null;
  const referenceDeviationBp =
    referencePriceCents !== null && referencePriceCents > 0
      ? Math.round(((priceExclVatCents - referencePriceCents) / referencePriceCents) * 10_000)
      : null;

  const subscription = priceSubscription(catalog, selection.subscriptionKey, costOfSale.dayRateCents);

  return {
    lines,
    optionLines,
    totalDays,
    daysByRole,
    subcontractedDays,
    subcontractedShareBp: shareBp(subcontractedDays, totalDays),
    subtotalCents,
    smallProjectApplied,
    smallProjectBp: smallProjectBpApplied,
    urgencyBp: urgencyBpApplied,
    totalUpliftBp,
    preDiscountCents,
    discountBp,
    discountCents,
    priceExclVatCents,
    vat,
    schedule,
    externalCostsCents,
    productionCostCents,
    marginCents,
    marginBp: shareBp(marginCents, priceExclVatCents),
    impliedDayRateCents,
    costOfSale,
    contingencyCents: offer ? applyBp(priceExclVatCents, offer.contingencyBp) : 0,
    band,
    referencePriceCents,
    referenceDeviationBp,
    subscription,
  };
}

function priceSubscription(
  catalog: PricingCatalog,
  key: string | null,
  internalDayRateCents: number
): SubscriptionResult | null {
  if (!key) return null;
  const subscription = catalog.subscriptions.find((s) => s.key === key);
  if (!subscription) return null;

  const { indexationBp } = catalog.settings;
  const monthlyPriceCents = indexCents(subscription.monthlyPriceCents, indexationBp);

  // Le coût d'un jour d'abonnement est le coût de revient interne : un
  // abonnement de maintenance n'est pas sous-traité par défaut, et supposer
  // le contraire ferait apparaître une marge qui dépend d'un freelance
  // que personne n'a engagé.
  const monthlyCostCents =
    Math.round(subscription.monthlyDays * internalDayRateCents) + subscription.monthlyExternalCents;
  const monthlyMarginCents = monthlyPriceCents - monthlyCostCents;

  return {
    key: subscription.key,
    label: subscription.label,
    monthlyPriceCents,
    annualValueCents: monthlyPriceCents * 12,
    monthlyDays: subscription.monthlyDays,
    monthlyCostCents,
    monthlyMarginCents,
    monthlyMarginBp: shareBp(monthlyMarginCents, monthlyPriceCents),
    minCommitmentMonths: subscription.minCommitmentMonths,
  };
}

/**
 * Répartit un total sur des lignes, au centime et sans perte.
 *
 * Utilisé par le mapping vers le devis. Exporté ici parce que le moteur est
 * propriétaire de la règle : les lignes doivent sommer au prix annoncé, et
 * c'est l'allocation qui le garantit, pas un recalcul.
 */
export function allocateToLines(totalCents: number, lines: PricedLine[]): number[] {
  return allocate(totalCents, lines.map((line) => line.sellCents));
}
