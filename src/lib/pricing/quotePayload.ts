import { buildQuoteDraft, sumLineItems, type QuoteLineDraft } from "./quoteMapping.ts";
import type { PricingResult } from "./engine.ts";
import type { PricingConditions } from "./types.ts";

// Du chiffrage à la charge utile exacte du devis.
//
// Cette fonction est pure, et c'est volontaire : c'est elle que le test
// d'intégration exerce. Un test qui insérerait vraiment en base aurait
// besoin d'une base, donc du réseau, donc d'un environnement — et il
// vérifierait surtout que PostgREST fonctionne. Ce qu'on veut vérifier,
// c'est que le bon nombre de lignes, les bons totaux et le bon instantané
// sortent d'une configuration donnée. Ça n'a pas besoin de base.
//
// L'écriture elle-même, derrière, tient en un insert.

export interface QuoteRecipientAddress {
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

export interface QuoteRecipient {
  name: string;
  email: string | null;
  company: string | null;
  address: QuoteRecipientAddress | null;
  siren: string | null;
  vatNumber: string | null;
}

export interface QuotePdfSchedule {
  label: string;
  amountCents: number;
}

/** Ce que le PDF affiche EN PLUS quand le devis vient d'un chiffrage. */
export interface QuotePdfPricing {
  vatRateBp: number;
  vatAmountCents: number;
  totalInclVatCents: number;
  vatExemptionMention: string | null;
  schedule: QuotePdfSchedule[];
  leadTimeLabel: string | null;
  included: string[];
  excluded: string[];
  assumptions: string[];
  options: QuoteLineDraft[];
}

export interface QuotePayload {
  recipientName: string;
  recipientEmail: string | null;
  // L'adresse et le SIREN vivent au PREMIER niveau, pas dans le bloc
  // pricing : un devis rédigé à la main en a besoin exactement autant, et
  // la spec demande de compléter les mentions manquantes du générateur
  // existant, pas d'en créer deux versions.
  recipientAddress: QuoteRecipientAddress | null;
  recipientSiren: string | null;
  recipientVatNumber: string | null;
  validUntil: string;
  lineItems: QuoteLineDraft[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  pricing: QuotePdfPricing;
}

export interface QuoteTexts {
  included: string[];
  excluded: string[];
  assumptions: string[];
}

function addDays(date: Date, days: number): string {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

export function buildQuotePayload(
  result: PricingResult,
  conditions: PricingConditions,
  recipient: QuoteRecipient,
  texts: QuoteTexts,
  today: Date
): QuotePayload {
  const draft = buildQuoteDraft(result, conditions.displayMode, texts.assumptions);

  // Garde-fou plutôt qu'espoir : c'est l'invariant qui fait toute la valeur
  // de l'allocation, et si elle cassait un jour, le devis afficherait
  // simplement un total différent du prix annoncé, sans rien signaler.
  const summed = sumLineItems(draft.lineItems);
  if (summed !== draft.subtotalCents) {
    throw new Error(
      `Les lignes du devis somment à ${summed} centimes pour un sous-total de ${draft.subtotalCents}. ` +
        "L'allocation est cassée : le devis ne doit pas partir."
    );
  }
  if (draft.subtotalCents - draft.discountCents !== draft.totalCents) {
    throw new Error("Sous-total moins remise ne tombe pas sur le total.");
  }

  return {
    // La raison sociale d'abord : un devis s'adresse à une structure, et
    // c'est elle qui apparaît sur le relevé bancaire du client.
    recipientName: recipient.company?.trim() || recipient.name,
    recipientEmail: recipient.email,
    recipientAddress: recipient.address,
    recipientSiren: recipient.siren,
    recipientVatNumber: recipient.vatNumber,
    validUntil: addDays(today, conditions.validityDays),
    lineItems: draft.lineItems,
    subtotalCents: draft.subtotalCents,
    discountCents: draft.discountCents,
    totalCents: draft.totalCents,
    pricing: {
      vatRateBp: result.vat.rateBp,
      vatAmountCents: result.vat.amountCents,
      totalInclVatCents: result.vat.totalInclVatCents,
      vatExemptionMention: result.vat.exemptionMention,
      schedule: result.schedule.map((entry) => ({ label: entry.label, amountCents: entry.amountCents })),
      leadTimeLabel: conditions.leadTimeLabel,
      included: texts.included,
      excluded: texts.excluded,
      assumptions: draft.assumptions,
      options: draft.optionLines,
    },
  };
}
