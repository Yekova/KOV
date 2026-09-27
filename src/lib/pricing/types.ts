// Les formes partagées du moteur de pricing.
//
// Ce dossier est volontairement pur : aucun import de `@/`, aucun accès à
// Supabase, aucun composant React. Les imports internes portent leur
// extension `.ts` explicite, parce que `node --test` exécute ces fichiers
// directement (Node 24 retire les types nativement) et ne résout ni
// l'alias `@/` ni les spécificateurs sans extension.
//
// Cette contrainte technique sert exactement l'exigence de la spec : le
// moteur ne PEUT PLUS importer l'application, même par distraction.

export type RegimeKey = "micro" | "is";
export type ComplexityKey = "simple" | "standard" | "high" | "critical";
export type UrgencyKey = "normal" | "reduced25" | "reduced40";
export type RoundCode = "R0" | "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7";
export type VatRegime = "franchise" | "standard";
export type ClientVatRegime = "liable" | "partial" | "exempt";
export type DisplayMode = "round" | "module";
export type MarketTier = "freelance" | "agence" | "premium";

export interface PricingRole {
  code: string;
  label: string;
  /** Base 2027. La version tarifaire l'indexe. */
  sellRateCents: number;
  /** Null pour un rôle interne. Peut dépasser le taux de vente : l'outil le signale, il ne le corrige pas. */
  freelanceCostCents: number | null;
  internalOnly: boolean;
  defaultSubcontracted: boolean;
}

export interface PricingModule {
  key: string;
  label: string;
  roundCode: RoundCode;
  roundSpanLabel: string | null;
  quantityUnit: string | null;
  externalCostsCents: number;
  /** { STRAT: 0.5, UX: 1.6 } — jours par rôle, pour une quantité de 1. */
  roleDays: Record<string, number>;
  quoteAssumption: string | null;
  isOptional: boolean;
}

export interface ScheduleTemplateEntry {
  label: string;
  percentBp: number;
  roundCode: RoundCode | null;
}

export interface PricingOffer {
  key: string;
  label: string;
  /** Base 2027. Null pour « sur mesure », qui n'a pas de grille. */
  referencePriceCents: number | null;
  externalCostsCents: number;
  leadTimeLabel: string | null;
  contingencyBp: number;
  paymentSchedule: ScheduleTemplateEntry[];
}

export interface MarketBand {
  tier: MarketTier;
  minCents: number | null;
  /** Null = bande ouverte vers le haut. */
  maxCents: number | null;
}

export interface PricingSubscription {
  key: string;
  label: string;
  monthlyPriceCents: number;
  monthlyDays: number;
  monthlyExternalCents: number;
  monthlyRoleCode: string | null;
  minCommitmentMonths: number;
}

export interface PricingSettings {
  year: number;
  label: string;
  regime: RegimeKey;

  targetNetIncomeCents: number;
  contributionRateBp: number;
  fixedCostsCents: number;
  depreciationCents: number;
  billableDays: number;
  contributionRateConfirmed: boolean;

  indexationBp: number;
  externalUpliftBp: number;
  complexityBp: Record<ComplexityKey, number>;
  urgencyBp: Record<UrgencyKey, number>;
  smallProjectBp: number;
  smallProjectThresholdDays: number;
  roundingStepCents: number;

  maxDiscountBp: number;
  floorDayRateCents: number;
  targetMarginBp: number;
  maxSubcontractedShareBp: number;
  scopingThresholdDays: number;
  benchmarkStalenessDays: number;
  gridDeviationBp: number;

  outOfScopeDayRateCents: number;
  quoteValidityDays: number;

  vatRegime: VatRegime;
  vatRateBp: number;
  vatExemptionMention: string | null;
  franchiseThresholdCents: number;
  franchiseIncreasedThresholdCents: number;
}

export interface SelectedModule {
  moduleKey: string;
  quantity: number;
  /** Rôles de CE module produits par un freelance plutôt qu'en interne. */
  subcontractedRoles: string[];
}

export interface PricingSelection {
  offerKey: string | null;
  modules: SelectedModule[];
  /** Modules proposés au client sans être totalisés. */
  options: SelectedModule[];
  subscriptionKey: string | null;
  complexity: ComplexityKey;
  urgency: UrgencyKey;
  /** Le régime de TVA du DESTINATAIRE, pas celui de KOV : il décide si le
   *  récapitulatif met le TTC en avant, pas si la TVA s'applique. */
  clientVatRegime: ClientVatRegime;
}

export interface PricingConditions {
  discountBp: number;
  discountReason: string | null;
  validityDays: number;
  leadTimeLabel: string | null;
  displayMode: DisplayMode;
  /** Null = l'échéancier par défaut de l'offre. */
  schedule: ScheduleTemplateEntry[] | null;
}

export interface PricingCatalog {
  settings: PricingSettings;
  roles: PricingRole[];
  offers: PricingOffer[];
  modules: PricingModule[];
  bandsByOffer: Record<string, MarketBand[]>;
  /** La composition par défaut de chaque offre, telle que la table la porte.
   *  Lue ici plutôt que devinée à partir des clés : une convention de
   *  nommage se casse au premier renommage, et sans bruit. */
  defaultModulesByOffer: Record<string, { moduleKey: string; quantity: number }[]>;
  subscriptions: PricingSubscription[];
}
