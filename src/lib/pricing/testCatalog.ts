import type {
  MarketBand,
  PricingCatalog,
  PricingModule,
  PricingOffer,
  PricingRole,
  PricingConditions,
  PricingSelection,
  PricingSettings,
  PricingSubscription,
  RoundCode,
} from "./types.ts";

// Le catalogue de référence, pour les tests.
//
// Transcription de docs/specs/pricing.md §5, identique au seed SQL de
// 20260927100200. Les deux disent la même chose dans deux langages, et les
// tests de calibrage vérifient les totaux que j'ai lus dans la base après
// avoir joué ce seed : landing 5,5 j / 235 400 €c, vitrine 16 j /
// 684 800 €c, avancé 29 j / 1 245 000 €c, outil 36 j / 1 584 000 €c,
// 3D 10 j / 445 000 €c, audit 3 j / 130 000 €c.
//
// Si l'un des deux dérive, ces totaux ne tombent plus.

const BASE_SETTINGS: Omit<
  PricingSettings,
  "year" | "label" | "regime" | "targetNetIncomeCents" | "contributionRateBp" | "fixedCostsCents" | "depreciationCents" | "billableDays" | "contributionRateConfirmed" | "indexationBp"
> = {
  externalUpliftBp: 1000,
  complexityBp: { simple: 9000, standard: 10_000, high: 12_000, critical: 14_000 },
  urgencyBp: { normal: 0, reduced25: 1500, reduced40: 3000 },
  smallProjectBp: 1500,
  smallProjectThresholdDays: 8,
  roundingStepCents: 5000,
  maxDiscountBp: 1000,
  floorDayRateCents: 42_000,
  targetMarginBp: 1500,
  maxSubcontractedShareBp: 4000,
  scopingThresholdDays: 15,
  benchmarkStalenessDays: 180,
  gridDeviationBp: 1000,
  outOfScopeDayRateCents: 45_000,
  quoteValidityDays: 30,
  vatRegime: "franchise",
  vatRateBp: 2000,
  vatExemptionMention: "TVA non applicable, art. 293 B du CGI",
  franchiseThresholdCents: 3_750_000,
  franchiseIncreasedThresholdCents: 4_125_000,
};

export const SETTINGS_2027: PricingSettings = {
  ...BASE_SETTINGS,
  year: 2027,
  label: "2027 — micro-entreprise",
  regime: "micro",
  targetNetIncomeCents: 1_800_000,
  contributionRateBp: 2580,
  fixedCostsCents: 844_000,
  depreciationCents: 100_000,
  billableDays: 123,
  contributionRateConfirmed: true,
  indexationBp: 0,
};

export const SETTINGS_2028: PricingSettings = {
  ...BASE_SETTINGS,
  year: 2028,
  label: "2028 — société à l'IS",
  regime: "is",
  targetNetIncomeCents: 2_640_000,
  contributionRateBp: 4500,
  fixedCostsCents: 1_572_000,
  depreciationCents: 150_000,
  billableDays: 130,
  contributionRateConfirmed: false,
  indexationBp: 500,
};

export const ROLES: PricingRole[] = [
  { code: "STRAT",  label: "Cadrage et stratégie",                        sellRateCents: 48_000, freelanceCostCents: null,   internalOnly: true,  defaultSubcontracted: false },
  { code: "UX",     label: "UX et architecture",                          sellRateCents: 44_000, freelanceCostCents: 45_000, internalOnly: false, defaultSubcontracted: false },
  { code: "UI",     label: "Direction artistique et design d'interface",  sellRateCents: 42_000, freelanceCostCents: 40_000, internalOnly: false, defaultSubcontracted: false },
  { code: "FRONT",  label: "Développement front et intégration",          sellRateCents: 42_000, freelanceCostCents: 43_000, internalOnly: false, defaultSubcontracted: false },
  { code: "FULL",   label: "Développement full-stack (Supabase, API)",    sellRateCents: 46_000, freelanceCostCents: 48_000, internalOnly: false, defaultSubcontracted: false },
  { code: "MOTION", label: "Motion design et 3D WebGL",                   sellRateCents: 46_000, freelanceCostCents: 45_000, internalOnly: false, defaultSubcontracted: false },
  { code: "QA",     label: "Recette, SEO technique, mise en production",  sellRateCents: 38_000, freelanceCostCents: null,   internalOnly: true,  defaultSubcontracted: false },
  { code: "COPY",   label: "Rédaction",                                   sellRateCents: 46_000, freelanceCostCents: 41_100, internalOnly: false, defaultSubcontracted: true },
  { code: "SEO",    label: "SEO éditorial",                               sellRateCents: 55_000, freelanceCostCents: 49_900, internalOnly: false, defaultSubcontracted: true },
  { code: "PHOTO",  label: "Photographie",                                sellRateCents: 60_000, freelanceCostCents: 52_200, internalOnly: false, defaultSubcontracted: true },
];

function module_(
  key: string,
  label: string,
  roundCode: RoundCode,
  roleDays: Record<string, number>,
  extra: Partial<PricingModule> = {}
): PricingModule {
  return {
    key,
    label,
    roundCode,
    roundSpanLabel: null,
    quantityUnit: null,
    externalCostsCents: 0,
    roleDays,
    quoteAssumption: null,
    isOptional: false,
    ...extra,
  };
}

const HALF_SPLIT = [
  { label: "À la commande", percentBp: 5000, roundCode: null },
  { label: "À la livraison", percentBp: 5000, roundCode: "R6" as RoundCode },
];

const THREE_SPLIT = [
  { label: "À la commande", percentBp: 4000, roundCode: null },
  { label: "À la validation du design", percentBp: 3000, roundCode: "R3" as RoundCode },
  { label: "À la recette", percentBp: 3000, roundCode: "R6" as RoundCode },
];

const FOUR_SPLIT = [
  { label: "À la commande", percentBp: 3000, roundCode: null },
  { label: "À la validation des maquettes", percentBp: 2500, roundCode: "R3" as RoundCode },
  { label: "À la version de recette", percentBp: 2500, roundCode: "R6" as RoundCode },
  { label: "À la mise en production", percentBp: 2000, roundCode: "R6" as RoundCode },
];

export const OFFERS: PricingOffer[] = [
  { key: "landing",  label: "Landing page premium",      referencePriceCents: 280_000,   externalCostsCents: 10_000,  leadTimeLabel: "3 à 5 semaines",   contingencyBp: 0,    paymentSchedule: HALF_SPLIT },
  { key: "vitrine",  label: "Site vitrine premium",      referencePriceCents: 700_000,   externalCostsCents: 30_000,  leadTimeLabel: "8 à 12 semaines",  contingencyBp: 0,    paymentSchedule: THREE_SPLIT },
  { key: "avance",   label: "Site premium avancé",       referencePriceCents: 1_350_000, externalCostsCents: 120_000, leadTimeLabel: "14 à 20 semaines", contingencyBp: 0,    paymentSchedule: THREE_SPLIT },
  { key: "outil",    label: "Outil métier",              referencePriceCents: 1_600_000, externalCostsCents: 60_000,  leadTimeLabel: "16 à 24 semaines", contingencyBp: 1000, paymentSchedule: FOUR_SPLIT },
  { key: "immersif", label: "Module immersif 3D WebGL",  referencePriceCents: 450_000,   externalCostsCents: 40_000,  leadTimeLabel: null,               contingencyBp: 0,    paymentSchedule: HALF_SPLIT },
  { key: "audit",    label: "Audit UX, technique et SEO",referencePriceCents: 150_000,   externalCostsCents: 0,       leadTimeLabel: "2 à 3 semaines",   contingencyBp: 0,    paymentSchedule: HALF_SPLIT },
  { key: "sur-mesure", label: "Sur mesure",              referencePriceCents: null,      externalCostsCents: 0,       leadTimeLabel: null,               contingencyBp: 0,    paymentSchedule: HALF_SPLIT },
];

export const MODULES: PricingModule[] = [
  // Landing — 5,5 jours
  module_("landing-cadrage",   "Cadrage court et messages clés",                   "R0", { STRAT: 0.5 }),
  module_("landing-structure", "Structure de la page",                             "R1", { UX: 0.5 }),
  module_("landing-design",    "Direction artistique et design desktop et mobile", "R2", { UI: 1.8 }, { roundSpanLabel: "R2-R3" }),
  module_("landing-build",     "Intégration Next.js",                              "R4", { FRONT: 1.6 }),
  module_("landing-motion",    "Animations d'entrée et de scroll",                 "R5", { MOTION: 0.6 }),
  module_("landing-launch",    "Recette, analytics, mise en ligne",                "R6", { QA: 0.5 }),

  // Vitrine — 16 jours
  module_("vitrine-cadrage",      "Atelier de cadrage et note de cadrage",                              "R0", { STRAT: 0.8 }),
  module_("vitrine-architecture", "Arborescence et wireframes (jusqu'à 6 pages)",                       "R1", { UX: 1.6 }),
  module_("vitrine-da",           "Direction artistique",                                               "R2", { UI: 1.6 }),
  module_("vitrine-design",       "Design de 6 pages, desktop et mobile, design system léger",          "R3", { UI: 3.2 }),
  module_("vitrine-build",        "Intégration Next.js et CMS",                                         "R4", { FRONT: 4.4, FULL: 1.2 }),
  module_("vitrine-motion",       "Motion et micro-interactions standard",                              "R5", { MOTION: 1.6 }),
  module_("vitrine-launch",       "Recette, SEO technique, performance, analytics, mise en production", "R6", { QA: 1.6 }),

  // Avancé — 29 jours
  module_("avance-cadrage",      "Cadrage approfondi (deux ateliers)",                  "R0", { STRAT: 1.5 }),
  module_("avance-architecture", "Architecture 10 à 20 pages, parcours, contenus",      "R1", { UX: 3 }),
  module_("avance-da",           "Direction artistique complète",                       "R2", { UI: 2.5 }),
  module_("avance-design",       "Design de 12 gabarits et design system",              "R3", { UI: 6 }),
  module_("avance-build",        "Build Next.js et CMS riche",                          "R4", { FRONT: 7, FULL: 2.5 }),
  module_("avance-motion",       "Motion avancé (scroll, transitions de page)",         "R5", { MOTION: 3.5 }),
  module_("avance-launch",       "Recette, SEO, performance, accessibilité, analytics", "R6", { QA: 3 }),

  // Outil métier — 36 jours
  module_("outil-cadrage",  "Cadrage fonctionnel et modèle de données",                "R0", { STRAT: 2, FULL: 1 }),
  module_("outil-specs",    "Spécifications, parcours, wireframes",                    "R1", { UX: 4 }),
  module_("outil-da",       "Déclinaison de la direction artistique",                  "R2", { UI: 1.5 }),
  module_("outil-design",   "Design des écrans (environ 12) et composants",            "R3", { UI: 4.5 }),
  module_("outil-build",    "Authentification, rôles, modèle de données, RLS, écrans", "R4", { FULL: 10, FRONT: 6 }),
  module_("outil-polish",   "Polish et micro-interactions",                            "R5", { MOTION: 1 }),
  module_("outil-recette",  "Recette, sécurité, mise en production, tests",            "R6", { QA: 3, FULL: 1 }),
  module_("outil-pilotage", "Pilotage et recette avec le client",                      "R0", { STRAT: 2 }, { roundSpanLabel: "R0-R6" }),

  // Module 3D — 10 jours
  module_("immersif-cadrage", "Cadrage de la scène",                               "R0", { STRAT: 0.5 }),
  module_("immersif-concept", "Concept visuel 3D",                                 "R2", { UI: 1.5 }),
  module_("immersif-build",   "Scène Three.js ou React Three Fiber, optimisation", "R4", { MOTION: 6.5, FRONT: 0.5 }),
  module_("immersif-perf",    "Tests de performance multi-appareils",              "R6", { QA: 1 }),

  // Audit — 3 jours
  module_("audit-strategie", "Analyse stratégique et restitution", "R0", { STRAT: 1 }, { roundSpanLabel: "R0-R6" }),
  module_("audit-ux",        "Audit UX",                           "R1", { UX: 1 }),
  module_("audit-technique", "Audit performance et SEO technique", "R6", { QA: 1 }),

  // Quelques modules optionnels, ceux qu'exercent les tests.
  module_("opt-page-supplementaire", "Page supplémentaire sur gabarit existant", "R3", { UI: 0.3, FRONT: 0.4 }, { isOptional: true, quantityUnit: "page", roundSpanLabel: "R3-R4" }),
  module_("opt-redaction",           "Rédaction des contenus",                   "R1", { COPY: 0.5 },          { isOptional: true, quantityUnit: "page", roundSpanLabel: "R1-R3" }),
  module_("opt-traduction",          "Traduction professionnelle",               "R4", {},                     { isOptional: true, externalCostsCents: 40_000, quantityUnit: "langue" }),
  module_("opt-pages-legales",       "Pages légales et bandeau cookies",         "R4", { UX: 0.5, FRONT: 0.5 },{ isOptional: true, quoteAssumption: "La rédaction et la validation juridique des mentions relèvent du client." }),
];

export const BANDS_BY_OFFER: Record<string, MarketBand[]> = {
  landing:  [{ tier: "freelance", minCents: 80_000, maxCents: 200_000 }, { tier: "agence", minCents: 200_000, maxCents: 400_000 }, { tier: "premium", minCents: 400_000, maxCents: null }],
  vitrine:  [{ tier: "freelance", minCents: 100_000, maxCents: 500_000 }, { tier: "agence", minCents: 350_000, maxCents: 800_000 }, { tier: "premium", minCents: 800_000, maxCents: 1_500_000 }],
  avance:   [{ tier: "agence", minCents: 1_000_000, maxCents: 2_000_000 }, { tier: "premium", minCents: 2_000_000, maxCents: null }],
  outil:    [{ tier: "agence", minCents: 900_000, maxCents: 3_500_000 }],
  immersif: [{ tier: "agence", minCents: 250_000, maxCents: 1_200_000 }],
  audit:    [{ tier: "agence", minCents: 90_000, maxCents: 300_000 }],
};

export const SUBSCRIPTIONS: PricingSubscription[] = [
  { key: "essentiel",     label: "Essentiel",            monthlyPriceCents: 9500,  monthlyDays: 0.15, monthlyExternalCents: 1000, monthlyRoleCode: "QA",    minCommitmentMonths: 0 },
  { key: "evolution",     label: "Évolution",            monthlyPriceCents: 42_000, monthlyDays: 0.7,  monthlyExternalCents: 1500, monthlyRoleCode: "FRONT", minCommitmentMonths: 12 },
  { key: "support-outil", label: "Support outil métier", monthlyPriceCents: 80_000, monthlyDays: 1.2,  monthlyExternalCents: 5000, monthlyRoleCode: "FULL",  minCommitmentMonths: 12 },
];

/** La composition par défaut de chaque offre, dérivée des préfixes de clé —
 *  acceptable ICI parce que c'est une donnée de test que le fichier contrôle
 *  de bout en bout. Le catalogue réel la lit dans sa table. */
export const DEFAULT_MODULES_BY_OFFER: Record<string, { moduleKey: string; quantity: number }[]> =
  Object.fromEntries(
    OFFERS.map((offer) => [
      offer.key,
      MODULES.filter((module) => !module.isOptional && module.key.startsWith(`${offer.key}-`)).map((module) => ({
        moduleKey: module.key,
        quantity: 1,
      })),
    ])
  );

export function buildCatalog(settings: PricingSettings): PricingCatalog {
  return {
    settings,
    roles: ROLES,
    offers: OFFERS,
    modules: MODULES,
    bandsByOffer: BANDS_BY_OFFER,
    defaultModulesByOffer: DEFAULT_MODULES_BY_OFFER,
    subscriptions: SUBSCRIPTIONS,
  };
}

/** La sélection par défaut d'une offre, telle que le configurateur la pré-coche. */
export function defaultSelectionFor(offerKey: string): PricingSelection {
  return {
    offerKey,
    modules: DEFAULT_MODULES_BY_OFFER[offerKey].map((entry) => ({
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

export const DEFAULT_CONDITIONS: PricingConditions = {
  discountBp: 0,
  discountReason: null,
  validityDays: 30,
  leadTimeLabel: null,
  displayMode: "round",
  schedule: null,
};
