"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Les écritures des réglages de pricing.
//
// Elles rendent `{ error }` au lieu de lever : Next 16 masque le message
// d'une exception levée dans une Server Action en production, ce qui
// transformerait « Le taux doit être positif » en « une erreur est
// survenue ». Convention déjà en place dans quotes/actions.ts.

function parseEuroToCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const cents = Math.round(parseFloat(value.replace(",", ".").replace(/\s/g, "")) * 100);
  return Number.isFinite(cents) ? cents : null;
}

function parsePercentToBp(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const bp = Math.round(parseFloat(value.replace(",", ".")) * 100);
  return Number.isFinite(bp) ? bp : null;
}

function parseDays(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const days = parseFloat(value.replace(",", "."));
  return Number.isFinite(days) ? days : null;
}

function revalidatePricing() {
  revalidatePath("/admin/pricing", "layout");
}

export async function updateSettingsVersion(
  versionId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  await requireAdmin();

  const targetNetIncomeCents = parseEuroToCents(formData.get("target_net_income"));
  const contributionRateBp = parsePercentToBp(formData.get("contribution_rate"));
  const fixedCostsCents = parseEuroToCents(formData.get("fixed_costs"));
  const depreciationCents = parseEuroToCents(formData.get("depreciation"));
  const billableDays = parseDays(formData.get("billable_days"));
  const indexationBp = parsePercentToBp(formData.get("indexation")) ?? 0;
  const floorDayRateCents = parseEuroToCents(formData.get("floor_day_rate"));
  const targetMarginBp = parsePercentToBp(formData.get("target_margin"));
  const maxDiscountBp = parsePercentToBp(formData.get("max_discount"));
  const externalUpliftBp = parsePercentToBp(formData.get("external_uplift"));
  const smallProjectBp = parsePercentToBp(formData.get("small_project"));
  const smallProjectThresholdDays = parseDays(formData.get("small_project_threshold"));
  const outOfScopeDayRateCents = parseEuroToCents(formData.get("out_of_scope_day_rate"));
  const quoteValidityDays = Number(formData.get("quote_validity_days"));
  const vatRegime = formData.get("vat_regime");
  const vatRateBp = parsePercentToBp(formData.get("vat_rate"));
  const vatExemptionMention = formData.get("vat_exemption_mention");
  const contributionRateConfirmed = formData.get("contribution_rate_confirmed") === "on";

  if (targetNetIncomeCents === null || targetNetIncomeCents < 0) return { error: "Rémunération cible invalide." };
  if (contributionRateBp === null || contributionRateBp < 0 || contributionRateBp >= 10_000) {
    return { error: "Le taux de cotisations doit être compris entre 0 et 100 % (exclu)." };
  }
  if (fixedCostsCents === null || fixedCostsCents < 0) return { error: "Charges fixes invalides." };
  if (depreciationCents === null || depreciationCents < 0) return { error: "Amortissements invalides." };
  if (billableDays === null || billableDays <= 0) return { error: "Le nombre de jours facturables doit être positif." };
  if (floorDayRateCents === null || floorDayRateCents < 0) return { error: "TJM plancher invalide." };
  if (targetMarginBp === null || targetMarginBp < 0) return { error: "Marge cible invalide." };
  if (maxDiscountBp === null || maxDiscountBp < 0) return { error: "Remise maximale invalide." };
  if (externalUpliftBp === null || externalUpliftBp < 0) return { error: "Majoration des coûts externes invalide." };
  if (smallProjectBp === null || smallProjectBp < 0) return { error: "Majoration petit projet invalide." };
  if (smallProjectThresholdDays === null || smallProjectThresholdDays <= 0) return { error: "Seuil petit projet invalide." };
  if (outOfScopeDayRateCents === null || outOfScopeDayRateCents < 0) return { error: "Taux hors périmètre invalide." };
  if (!Number.isFinite(quoteValidityDays) || quoteValidityDays <= 0) return { error: "Durée de validité invalide." };
  if (vatRegime !== "franchise" && vatRegime !== "standard") return { error: "Régime de TVA inconnu." };
  if (vatRateBp === null || vatRateBp < 0) return { error: "Taux de TVA invalide." };

  const { error } = await supabaseAdmin
    .from("pricing_settings_versions")
    .update({
      target_net_income_cents: targetNetIncomeCents,
      contribution_rate_bp: contributionRateBp,
      contribution_rate_confirmed: contributionRateConfirmed,
      fixed_costs_cents: fixedCostsCents,
      depreciation_cents: depreciationCents,
      billable_days: billableDays,
      indexation_bp: indexationBp,
      floor_day_rate_cents: floorDayRateCents,
      target_margin_bp: targetMarginBp,
      max_discount_bp: maxDiscountBp,
      external_uplift_bp: externalUpliftBp,
      small_project_bp: smallProjectBp,
      small_project_threshold_days: smallProjectThresholdDays,
      out_of_scope_day_rate_cents: outOfScopeDayRateCents,
      quote_validity_days: quoteValidityDays,
      vat_regime: vatRegime,
      vat_rate_bp: vatRateBp,
      vat_exemption_mention:
        typeof vatExemptionMention === "string" && vatExemptionMention.trim() ? vatExemptionMention.trim() : null,
    })
    .eq("id", versionId);

  if (error) return { error: "L'enregistrement des paramètres a échoué." };

  revalidatePricing();
  return { error: null };
}

export async function updateRole(roleCode: string, formData: FormData): Promise<{ error: string | null }> {
  await requireAdmin();

  const label = formData.get("label");
  const sellRateCents = parseEuroToCents(formData.get("sell_rate"));
  const freelanceCostCents = parseEuroToCents(formData.get("freelance_cost"));
  const internalOnly = formData.get("internal_only") === "on";
  const defaultSubcontracted = formData.get("default_subcontracted") === "on";

  if (typeof label !== "string" || !label.trim()) return { error: "Le libellé est requis." };
  if (sellRateCents === null || sellRateCents < 0) return { error: "Taux de vente invalide." };
  if (freelanceCostCents !== null && freelanceCostCents < 0) return { error: "Coût freelance invalide." };

  // Les mêmes règles que la contrainte en base, vérifiées ici pour rendre un
  // message lisible plutôt qu'une violation de contrainte Postgres.
  if (internalOnly && freelanceCostCents !== null) {
    return { error: "Un rôle interne n'a pas de coût freelance : videz le champ ou décochez « interne »." };
  }
  if (!internalOnly && defaultSubcontracted && freelanceCostCents === null) {
    return { error: "Un rôle sous-traité par défaut a besoin d'un coût freelance, sinon sa marge se calcule sur un coût inconnu." };
  }

  const { error } = await supabaseAdmin
    .from("pricing_roles")
    .update({
      label: label.trim(),
      sell_rate_cents: sellRateCents,
      freelance_cost_cents: internalOnly ? null : freelanceCostCents,
      internal_only: internalOnly,
      default_subcontracted: internalOnly ? false : defaultSubcontracted,
    })
    .eq("code", roleCode);

  if (error) return { error: "L'enregistrement du rôle a échoué." };

  revalidatePricing();
  return { error: null };
}

export async function updateBenchmark(
  benchmarkId: string,
  formData: FormData
): Promise<{ error: string | null }> {
  await requireAdmin();

  const valueCents = parseEuroToCents(formData.get("value"));
  const valueMaxCents = parseEuroToCents(formData.get("value_max"));
  const consultedAt = formData.get("consulted_at");
  const sourceUrl = formData.get("source_url");

  if (valueCents === null || valueCents < 0) return { error: "Valeur invalide." };
  if (valueMaxCents !== null && valueMaxCents < valueCents) {
    return { error: "La borne haute doit être supérieure à la valeur basse." };
  }
  if (typeof consultedAt !== "string" || !consultedAt) return { error: "Date de consultation requise." };

  // Une date de consultation dans le futur ferait passer une référence
  // périmée pour fraîche : c'est exactement ce que l'alerte doit empêcher.
  if (consultedAt > new Date().toISOString().slice(0, 10)) {
    return { error: "Une référence ne peut pas avoir été consultée dans le futur." };
  }

  const { error } = await supabaseAdmin
    .from("pricing_market_benchmarks")
    .update({
      value_cents: valueCents,
      value_max_cents: valueMaxCents,
      consulted_at: consultedAt,
      source_url: typeof sourceUrl === "string" && sourceUrl.trim() ? sourceUrl.trim() : null,
    })
    .eq("id", benchmarkId);

  if (error) return { error: "L'enregistrement de la référence a échoué." };

  revalidatePricing();
  return { error: null };
}

export async function archiveBenchmark(benchmarkId: string): Promise<{ error: string | null }> {
  await requireAdmin();

  // Archivée, jamais supprimée : une référence citée dans un devis signé
  // doit rester lisible le jour où quelqu'un demande d'où venait le prix.
  const { error } = await supabaseAdmin
    .from("pricing_market_benchmarks")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", benchmarkId);

  if (error) return { error: "L'archivage a échoué." };

  revalidatePricing();
  return { error: null };
}
