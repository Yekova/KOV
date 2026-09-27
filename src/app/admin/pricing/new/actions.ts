"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPricingCatalog } from "@/lib/pricing/catalog";
import { priceConfiguration } from "@/lib/pricing/engine";
import type { ClientVatRegime, PricingConditions, PricingSelection } from "@/lib/pricing/types";

// L'enregistrement d'un chiffrage.
//
// ── LE PRIX EST RECALCULÉ ICI, JAMAIS REPRIS DU NAVIGATEUR ───────────────
//
// Le configurateur calcule côté client pour que l'affichage réagisse à
// chaque case cochée. Ce résultat sert à voir, pas à enregistrer : il vient
// d'un code que le navigateur peut modifier. Le serveur recharge donc le
// catalogue et rejoue le même moteur sur la même sélection.
//
// Ce n'est pas de la paranoïa d'authentification — seul un admin arrive
// ici. C'est que l'instantané stocké est ce qui servira, dans un an, à
// expliquer un prix devant un client. Il doit venir d'une source dont on
// répond.

export interface SaveConfigurationInput {
  configurationId?: string;
  settingsVersionId: string;
  title: string;
  clientId: string | null;
  leadId: string | null;
  segment: string | null;
  clientVatRegime: ClientVatRegime;
  selection: PricingSelection;
  conditions: PricingConditions;
}

export async function saveConfiguration(
  input: SaveConfigurationInput
): Promise<{ error: string | null; configurationId?: string }> {
  const admin = await requireAdmin();

  const title = input.title.trim();
  if (!title) return { error: "Donnez un nom à ce chiffrage." };

  const catalog = await getPricingCatalog(input.settingsVersionId);
  if (!catalog) return { error: "Version tarifaire introuvable." };

  // On ne fait pas confiance aux clés reçues : un module archivé entre-temps
  // ou une clé inconnue doit être refusée, pas silencieusement ignorée par
  // le moteur (qui, lui, saute les modules qu'il ne trouve pas).
  const knownModules = new Set(catalog.modules.map((module) => module.key));
  const unknown = [...input.selection.modules, ...input.selection.options]
    .map((entry) => entry.moduleKey)
    .filter((key) => !knownModules.has(key));
  if (unknown.length > 0) {
    return { error: `Modules inconnus ou archivés : ${unknown.join(", ")}.` };
  }
  if ([...input.selection.modules, ...input.selection.options].some((entry) => !(entry.quantity > 0))) {
    return { error: "Une quantité doit être strictement positive." };
  }
  if (input.selection.offerKey && !catalog.offers.some((offer) => offer.key === input.selection.offerKey)) {
    return { error: "Offre introuvable." };
  }

  const selection: PricingSelection = { ...input.selection, clientVatRegime: input.clientVatRegime };
  const result = priceConfiguration(catalog, selection, input.conditions);

  const offerId = input.selection.offerKey
    ? (
        await supabaseAdmin
          .from("pricing_offers")
          .select("id")
          .eq("key", input.selection.offerKey)
          .maybeSingle()
      ).data?.id ?? null
    : null;

  const row = {
    settings_version_id: input.settingsVersionId,
    offer_id: offerId,
    client_id: input.clientId,
    lead_id: input.leadId,
    title,
    segment: input.segment,
    client_vat_regime: input.clientVatRegime,
    selection: selection as unknown as Record<string, unknown>,
    conditions: input.conditions as unknown as Record<string, unknown>,
    snapshot: result as unknown as Record<string, unknown>,
  };

  if (input.configurationId) {
    const { error } = await supabaseAdmin
      .from("pricing_configurations")
      .update(row)
      .eq("id", input.configurationId);
    if (error) return { error: "L'enregistrement du chiffrage a échoué." };

    revalidatePath("/admin/pricing");
    revalidatePath(`/admin/pricing/${input.configurationId}`);
    return { error: null, configurationId: input.configurationId };
  }

  const { data, error } = await supabaseAdmin
    .from("pricing_configurations")
    .insert({ ...row, created_by: admin.id })
    .select("id")
    .single();

  if (error || !data) return { error: "L'enregistrement du chiffrage a échoué." };

  revalidatePath("/admin/pricing");
  return { error: null, configurationId: data.id as string };
}
