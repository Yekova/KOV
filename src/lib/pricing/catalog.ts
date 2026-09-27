import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type {
  ComplexityKey,
  MarketBand,
  MarketTier,
  PricingCatalog,
  PricingModule,
  PricingOffer,
  PricingRole,
  PricingSettings,
  PricingSubscription,
  RoundCode,
  ScheduleTemplateEntry,
  UrgencyKey,
} from "./types.ts";

// Le chargeur.
//
// C'est le seul fichier de ce dossier qui connaisse Supabase. Le moteur, à
// côté, ne sait pas d'où viennent ses chiffres — c'est ce qui permet de le
// tester avec un catalogue écrit à la main, et c'est pour ça que cette
// frontière mérite un fichier à elle plutôt que quelques requêtes dispersées
// dans les écrans.

export interface SettingsVersionSummary {
  id: string;
  year: number;
  label: string;
  effectiveFrom: string;
  regime: "micro" | "is";
  contributionRateConfirmed: boolean;
}

export interface BenchmarkRow {
  id: string;
  label: string;
  valueCents: number;
  valueMaxCents: number | null;
  unit: "day" | "project" | "month";
  seniority: string | null;
  zone: string | null;
  source: string;
  sourceUrl: string | null;
  consultedAt: string;
  nature: "platform_statistic" | "individual_observation" | "commercial_page" | "secondary_source";
  notes: string | null;
}

export interface TextTemplateRow {
  id: string;
  key: string;
  kind: "included" | "excluded" | "assumption" | "intro" | "module_description";
  body: string;
  position: number;
}

export async function listSettingsVersions(): Promise<SettingsVersionSummary[]> {
  const { data } = await supabaseAdmin
    .from("pricing_settings_versions")
    .select("id, year, label, effective_from, regime, contribution_rate_confirmed")
    .order("year", { ascending: true })
    .order("effective_from", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    year: row.year as number,
    label: row.label as string,
    effectiveFrom: row.effective_from as string,
    regime: row.regime as "micro" | "is",
    contributionRateConfirmed: row.contribution_rate_confirmed as boolean,
  }));
}

/**
 * La version tarifaire à utiliser par défaut.
 *
 * La plus récente dont la date d'effet est passée. S'il n'y en a aucune — le
 * cas aujourd'hui, puisque la spec ne donne de paramètres qu'à partir de
 * 2027 — on prend la plus proche dans le futur plutôt que de rendre null.
 * Fabriquer une version pour l'année en cours reviendrait à inventer le
 * chiffre qui pilote toutes les alertes bloquantes.
 */
export async function getDefaultSettingsVersionId(today = new Date()): Promise<string | null> {
  const versions = await listSettingsVersions();
  if (versions.length === 0) return null;

  const iso = today.toISOString().slice(0, 10);
  const past = versions.filter((version) => version.effectiveFrom <= iso);
  if (past.length > 0) return past[past.length - 1].id;
  return versions[0].id;
}

function toSettings(row: Record<string, unknown>): PricingSettings {
  const complexityBp: Record<ComplexityKey, number> = {
    simple: row.complexity_simple_bp as number,
    standard: row.complexity_standard_bp as number,
    high: row.complexity_high_bp as number,
    critical: row.complexity_critical_bp as number,
  };
  const urgencyBp: Record<UrgencyKey, number> = {
    normal: row.urgency_normal_bp as number,
    reduced25: row.urgency_reduced_25_bp as number,
    reduced40: row.urgency_reduced_40_bp as number,
  };

  return {
    year: row.year as number,
    label: row.label as string,
    regime: row.regime as "micro" | "is",
    targetNetIncomeCents: Number(row.target_net_income_cents),
    contributionRateBp: row.contribution_rate_bp as number,
    fixedCostsCents: Number(row.fixed_costs_cents),
    depreciationCents: Number(row.depreciation_cents),
    billableDays: Number(row.billable_days),
    contributionRateConfirmed: row.contribution_rate_confirmed as boolean,
    indexationBp: row.indexation_bp as number,
    externalUpliftBp: row.external_uplift_bp as number,
    complexityBp,
    urgencyBp,
    smallProjectBp: row.small_project_bp as number,
    smallProjectThresholdDays: Number(row.small_project_threshold_days),
    roundingStepCents: Number(row.rounding_step_cents),
    maxDiscountBp: row.max_discount_bp as number,
    floorDayRateCents: Number(row.floor_day_rate_cents),
    targetMarginBp: row.target_margin_bp as number,
    maxSubcontractedShareBp: row.max_subcontracted_share_bp as number,
    scopingThresholdDays: Number(row.scoping_threshold_days),
    benchmarkStalenessDays: row.benchmark_staleness_days as number,
    gridDeviationBp: row.grid_deviation_bp as number,
    outOfScopeDayRateCents: Number(row.out_of_scope_day_rate_cents),
    quoteValidityDays: row.quote_validity_days as number,
    vatRegime: row.vat_regime as "franchise" | "standard",
    vatRateBp: row.vat_rate_bp as number,
    vatExemptionMention: (row.vat_exemption_mention as string | null) ?? null,
    franchiseThresholdCents: Number(row.franchise_threshold_cents),
    franchiseIncreasedThresholdCents: Number(row.franchise_increased_threshold_cents),
  };
}

// Les montants en `bigint` reviennent de PostgREST en chaînes dès qu'ils
// dépassent ce que JSON garantit. Number() les ramène ; nos montants
// tiennent très largement dans un entier sûr (un devis de dix millions
// d'euros ferait 10^9 centimes, contre 9 × 10^15 disponibles).
function toCents(value: unknown): number {
  return Number(value ?? 0);
}

export async function getPricingCatalog(settingsVersionId: string): Promise<PricingCatalog | null> {
  const [{ data: settingsRow }, { data: roleRows }, { data: offerRows }, { data: moduleRows }, { data: dayRows }, { data: defaultRows }, { data: bandRows }, { data: subscriptionRows }] =
    await Promise.all([
      supabaseAdmin.from("pricing_settings_versions").select("*").eq("id", settingsVersionId).maybeSingle(),
      supabaseAdmin
        .from("pricing_roles")
        .select("code, label, sell_rate_cents, freelance_cost_cents, internal_only, default_subcontracted, position")
        .is("archived_at", null)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("pricing_offers")
        .select("id, key, label, summary, reference_price_cents, external_costs_cents, lead_time_label, contingency_bp, payment_schedule, position")
        .is("archived_at", null)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("pricing_modules")
        .select("id, key, label, description, round_code, round_span_label, quantity_unit, default_quantity, external_costs_cents, is_optional, depends_on, conflicts_with, quote_assumption, position")
        .is("archived_at", null)
        .order("position", { ascending: true }),
      supabaseAdmin.from("pricing_module_role_days").select("module_id, role_code, days"),
      supabaseAdmin.from("pricing_offer_default_modules").select("offer_id, module_id, quantity, position"),
      supabaseAdmin.from("pricing_market_bands").select("offer_id, tier, min_cents, max_cents, position"),
      supabaseAdmin
        .from("pricing_subscriptions")
        .select("key, label, description, monthly_price_cents, monthly_days, monthly_external_cents, monthly_role_code, min_commitment_months, position")
        .is("archived_at", null)
        .order("position", { ascending: true }),
    ]);

  if (!settingsRow) return null;

  const roles: PricingRole[] = (roleRows ?? []).map((row) => ({
    code: row.code as string,
    label: row.label as string,
    sellRateCents: toCents(row.sell_rate_cents),
    freelanceCostCents: row.freelance_cost_cents === null ? null : toCents(row.freelance_cost_cents),
    internalOnly: row.internal_only as boolean,
    defaultSubcontracted: row.default_subcontracted as boolean,
  }));

  const daysByModule = new Map<string, Record<string, number>>();
  for (const row of dayRows ?? []) {
    const moduleId = row.module_id as string;
    const current = daysByModule.get(moduleId) ?? {};
    current[row.role_code as string] = Number(row.days);
    daysByModule.set(moduleId, current);
  }

  const modules: PricingModule[] = (moduleRows ?? []).map((row) => ({
    key: row.key as string,
    label: row.label as string,
    roundCode: row.round_code as RoundCode,
    roundSpanLabel: (row.round_span_label as string | null) ?? null,
    quantityUnit: (row.quantity_unit as string | null) ?? null,
    externalCostsCents: toCents(row.external_costs_cents),
    roleDays: daysByModule.get(row.id as string) ?? {},
    quoteAssumption: (row.quote_assumption as string | null) ?? null,
    isOptional: row.is_optional as boolean,
  }));

  const moduleKeyById = new Map((moduleRows ?? []).map((row) => [row.id as string, row.key as string]));
  const offerKeyById = new Map((offerRows ?? []).map((row) => [row.id as string, row.key as string]));

  const offers: PricingOffer[] = (offerRows ?? []).map((row) => ({
    key: row.key as string,
    label: row.label as string,
    referencePriceCents: row.reference_price_cents === null ? null : toCents(row.reference_price_cents),
    externalCostsCents: toCents(row.external_costs_cents),
    leadTimeLabel: (row.lead_time_label as string | null) ?? null,
    contingencyBp: row.contingency_bp as number,
    paymentSchedule: parseSchedule(row.payment_schedule),
  }));

  const defaultModulesByOffer: Record<string, { moduleKey: string; quantity: number }[]> = {};
  for (const row of [...(defaultRows ?? [])].sort((a, b) => (a.position as number) - (b.position as number))) {
    const offerKey = offerKeyById.get(row.offer_id as string);
    const moduleKey = moduleKeyById.get(row.module_id as string);
    if (!offerKey || !moduleKey) continue;
    defaultModulesByOffer[offerKey] = [
      ...(defaultModulesByOffer[offerKey] ?? []),
      { moduleKey, quantity: Number(row.quantity) },
    ];
  }

  const bandsByOffer: Record<string, MarketBand[]> = {};
  for (const row of [...(bandRows ?? [])].sort((a, b) => (a.position as number) - (b.position as number))) {
    const offerKey = offerKeyById.get(row.offer_id as string);
    if (!offerKey) continue;
    bandsByOffer[offerKey] = [
      ...(bandsByOffer[offerKey] ?? []),
      {
        tier: row.tier as MarketTier,
        minCents: row.min_cents === null ? null : toCents(row.min_cents),
        maxCents: row.max_cents === null ? null : toCents(row.max_cents),
      },
    ];
  }

  const subscriptions: PricingSubscription[] = (subscriptionRows ?? []).map((row) => ({
    key: row.key as string,
    label: row.label as string,
    monthlyPriceCents: toCents(row.monthly_price_cents),
    monthlyDays: Number(row.monthly_days),
    monthlyExternalCents: toCents(row.monthly_external_cents),
    monthlyRoleCode: (row.monthly_role_code as string | null) ?? null,
    minCommitmentMonths: row.min_commitment_months as number,
  }));

  return {
    settings: toSettings(settingsRow as Record<string, unknown>),
    roles,
    offers,
    modules,
    bandsByOffer,
    defaultModulesByOffer,
    subscriptions,
  };
}

// L'échéancier arrive en jsonb. Il vient de notre propre base et pas d'un
// tiers, mais il est modifiable à la main depuis le tableau de bord
// Supabase : une ligne mal formée doit être ignorée, pas faire tomber la
// page de chiffrage.
function parseSchedule(raw: unknown): ScheduleTemplateEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: ScheduleTemplateEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label : null;
    const percentBp = Number(record.percent_bp);
    if (!label || !Number.isFinite(percentBp)) continue;
    entries.push({
      label,
      percentBp,
      roundCode: typeof record.round_code === "string" ? (record.round_code as RoundCode) : null,
    });
  }
  return entries;
}

export async function getBenchmarks(): Promise<BenchmarkRow[]> {
  const { data } = await supabaseAdmin
    .from("pricing_market_benchmarks")
    .select("id, label, value_cents, value_max_cents, unit, seniority, zone, source, source_url, consulted_at, nature, notes")
    .is("archived_at", null)
    .order("consulted_at", { ascending: true })
    .order("label", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: row.label as string,
    valueCents: toCents(row.value_cents),
    valueMaxCents: row.value_max_cents === null ? null : toCents(row.value_max_cents),
    unit: row.unit as BenchmarkRow["unit"],
    seniority: (row.seniority as string | null) ?? null,
    zone: (row.zone as string | null) ?? null,
    source: row.source as string,
    sourceUrl: (row.source_url as string | null) ?? null,
    consultedAt: row.consulted_at as string,
    nature: row.nature as BenchmarkRow["nature"],
    notes: (row.notes as string | null) ?? null,
  }));
}

/** La date de consultation la plus ancienne, pour l'alerte de fraîcheur. */
export async function getOldestBenchmarkDate(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("pricing_market_benchmarks")
    .select("consulted_at")
    .is("archived_at", null)
    .order("consulted_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data?.consulted_at as string | undefined) ?? null;
}

export async function getTextTemplates(): Promise<TextTemplateRow[]> {
  const { data } = await supabaseAdmin
    .from("pricing_text_templates")
    .select("id, key, kind, body, position")
    .is("archived_at", null)
    .order("kind", { ascending: true })
    .order("position", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    key: row.key as string,
    kind: row.kind as TextTemplateRow["kind"],
    body: row.body as string,
    position: row.position as number,
  }));
}
