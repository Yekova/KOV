"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createQuoteRecord } from "@/app/admin/quotes/actions";
import { getOldestBenchmarkDate, getPricingCatalog, getTextTemplates } from "@/lib/pricing/catalog";
import { collectAlerts, hasBlockingAlert, type PricingAlert } from "@/lib/pricing/alerts";
import { priceConfiguration } from "@/lib/pricing/engine";
import { buildQuotePayload, type QuoteRecipient } from "@/lib/pricing/quotePayload";
import { revalidateClient } from "@/lib/revalidateClient";
import type { PricingConditions, PricingSelection } from "@/lib/pricing/types";

// La génération du devis.
//
// ── CE QUI EST GARANTI ICI ───────────────────────────────────────────────
//
// 1. Le prix est RECALCULÉ côté serveur, pas repris de l'instantané ni du
//    navigateur. Un devis qui part chez un client ne doit pas dépendre de
//    ce qu'un écran avait affiché la veille.
//
// 2. Une alerte bloquante refuse la génération. La seule échappatoire est
//    une dérogation motivée, qui est écrite dans la ligne avec son auteur
//    et son horodatage.
//
// 3. La génération est réservée par compare-and-set sur le statut AVANT de
//    créer le devis. Deux clics sur le bouton ne peuvent pas produire deux
//    devis, donc deux numéros, dont l'un resterait orphelin — et un numéro
//    de devis attribué ne se rend pas.
//
//    Si la création échoue après la réservation, le statut est rendu. Ce
//    n'est pas risqué : l'insertion ayant échoué, le trigger de
//    numérotation a libéré son numéro dans la même transaction. C'est
//    exactement ce qu'une SEQUENCE Postgres n'aurait pas fait.

export interface GenerateQuoteResult {
  error: string | null;
  quoteId?: string;
  reference?: string;
  blockingAlerts?: PricingAlert[];
}

export async function generateQuoteFromConfiguration(
  configurationId: string,
  overrideReason?: string
): Promise<GenerateQuoteResult> {
  const admin = await requireAdmin();

  const { data: configuration } = await supabaseAdmin
    .from("pricing_configurations")
    .select("id, title, status, quote_id, settings_version_id, client_id, lead_id, client_vat_regime, selection, conditions")
    .eq("id", configurationId)
    .maybeSingle();

  if (!configuration) return { error: "Chiffrage introuvable." };
  if (configuration.quote_id) return { error: "Un devis a déjà été généré à partir de ce chiffrage." };

  const catalog = await getPricingCatalog(configuration.settings_version_id as string);
  if (!catalog) return { error: "Version tarifaire introuvable." };

  const selection = configuration.selection as unknown as PricingSelection;
  const conditions = configuration.conditions as unknown as PricingConditions;

  if (selection.modules.length === 0) {
    return { error: "Ce chiffrage ne contient aucun module : il n'y a rien à mettre sur un devis." };
  }

  const result = priceConfiguration(catalog, selection, conditions);
  const alerts = collectAlerts(result, catalog, selection, conditions, {
    oldestBenchmarkConsultedAt: await getOldestBenchmarkDate(),
    today: new Date(),
  });

  const blockingAlerts = alerts.filter((alert) => alert.level === "blocking");
  if (hasBlockingAlert(alerts) && !overrideReason?.trim()) {
    return {
      error: "Ce chiffrage déclenche une alerte bloquante. Une dérogation motivée est nécessaire.",
      blockingAlerts,
    };
  }

  const recipient = await resolveRecipient(
    configuration.client_id as string | null,
    configuration.lead_id as string | null
  );
  if (!recipient) {
    return { error: "Ce chiffrage n'a pas de destinataire. Rattachez-le à un client ou à un lead." };
  }

  const templates = await getTextTemplates();
  const texts = {
    included: templates.filter((t) => t.kind === "included").map((t) => t.body),
    excluded: templates.filter((t) => t.kind === "excluded").map((t) => t.body),
    assumptions: templates.filter((t) => t.kind === "assumption").map((t) => t.body),
  };

  let payload;
  try {
    payload = buildQuotePayload(result, conditions, recipient, texts, new Date());
  } catch (cause) {
    // buildQuotePayload lève quand l'allocation ne tombe pas juste. C'est
    // une invariante interne, pas une saisie fautive : on préfère refuser
    // le devis que d'en envoyer un dont les lignes ne somment pas.
    return { error: cause instanceof Error ? cause.message : "Le devis n'a pas pu être construit." };
  }

  // ── La réservation ─────────────────────────────────────────────────────
  const { data: claimed } = await supabaseAdmin
    .from("pricing_configurations")
    .update({ status: "quoted" })
    .eq("id", configurationId)
    .eq("status", "draft")
    .select("id");

  if (!claimed || claimed.length === 0) {
    return { error: "Ce chiffrage n'est plus un brouillon : sa génération a déjà été lancée, ou il est marqué perdu." };
  }

  const created = await createQuoteRecord({
    reference: null,
    recipientName: payload.recipientName,
    recipientEmail: payload.recipientEmail,
    clientId: configuration.client_id as string | null,
    leadId: configuration.lead_id as string | null,
    projectId: null,
    validUntil: payload.validUntil,
    lineItems: payload.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
    discountCents: payload.discountCents,
    recipientAddress: payload.recipientAddress,
    recipientSiren: payload.recipientSiren,
    recipientVatNumber: payload.recipientVatNumber,
    pricing: payload.pricing,
    actorId: admin.id,
  });

  if (created.error || !created.quoteId) {
    // On rend le statut. Aucun numéro n'a été consommé : l'insertion a
    // échoué, donc le trigger a libéré le sien dans la même transaction.
    await supabaseAdmin.from("pricing_configurations").update({ status: "draft" }).eq("id", configurationId);
    return { error: created.error ?? "La création du devis a échoué." };
  }

  await supabaseAdmin
    .from("pricing_configurations")
    .update({
      quote_id: created.quoteId,
      // L'instantané est réécrit avec le calcul du SERVEUR, celui qui a
      // réellement produit le devis. C'est lui qui devra expliquer le prix.
      snapshot: result as unknown as Record<string, unknown>,
      override_reason: overrideReason?.trim() || null,
      override_by: overrideReason?.trim() ? admin.id : null,
      override_at: overrideReason?.trim() ? new Date().toISOString() : null,
    })
    .eq("id", configurationId);

  revalidatePath("/admin/pricing");
  revalidatePath(`/admin/pricing/${configurationId}`);
  revalidatePath("/admin/quotes");
  if (configuration.client_id) revalidateClient(configuration.client_id as string);

  return { error: null, quoteId: created.quoteId, reference: created.reference };
}

async function resolveRecipient(clientId: string | null, leadId: string | null): Promise<QuoteRecipient | null> {
  if (clientId) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("full_name, company, email, address_street, address_postal_code, address_city, address_country, siren, vat_number")
      .eq("id", clientId)
      .maybeSingle();
    if (!data) return null;

    const hasAddress = Boolean(data.address_street || data.address_city);
    return {
      name: (data.full_name as string | null) ?? "Client",
      email: (data.email as string | null) ?? null,
      company: (data.company as string | null) ?? null,
      address: hasAddress
        ? {
            street: (data.address_street as string | null) ?? null,
            postalCode: (data.address_postal_code as string | null) ?? null,
            city: (data.address_city as string | null) ?? null,
            country: (data.address_country as string | null) ?? null,
          }
        : null,
      siren: (data.siren as string | null) ?? null,
      vatNumber: (data.vat_number as string | null) ?? null,
    };
  }

  if (leadId) {
    const { data } = await supabaseAdmin.from("leads").select("name, company, email").eq("id", leadId).maybeSingle();
    if (!data) return null;
    // Un lead n'a ni adresse ni SIREN en base : le PDF les omettra plutôt
    // que d'afficher des lignes vides. C'est la conversion en client qui
    // fait apparaître ces champs, pas une invention ici.
    return {
      name: data.name as string,
      email: (data.email as string | null) ?? null,
      company: (data.company as string | null) ?? null,
      address: null,
      siren: null,
      vatNumber: null,
    };
  }

  return null;
}
