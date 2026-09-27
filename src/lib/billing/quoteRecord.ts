import type { LineItem } from "./quoteLineItems";
import type { QuotePdfPricing, QuoteRecipientAddress } from "@/lib/pricing/quotePayload";

// La forme d'entrée du cœur de création d'un devis.
//
// Vit ici et non dans quotes/actions.ts parce qu'un fichier « use server »
// ne peut exporter que des fonctions asynchrones. Même raison que
// quoteLineItems.ts, qui a déjà payé ce détour.

export interface CreateQuoteRecordInput {
  /** Null = la base attribue le numéro (trigger assign_document_reference). */
  reference: string | null;
  recipientName: string;
  recipientEmail: string | null;
  clientId: string | null;
  leadId: string | null;
  projectId: string | null;
  validUntil: string | null;
  lineItems: LineItem[];
  discountCents: number;

  /** Identité du destinataire sur le PDF. Absente = comportement d'avant. */
  recipientAddress?: QuoteRecipientAddress | null;
  recipientSiren?: string | null;
  recipientVatNumber?: string | null;

  /** Bloc TVA, échéancier, inclus / non inclus / hypothèses. */
  pricing?: QuotePdfPricing | null;

  /** PDF mis en page ailleurs, utilisé tel quel. */
  customPdf?: File | null;

  /** L'admin à l'origine de la création, pour le journal d'activité. */
  actorId: string;

  /** Lien vers le chiffrage dont ce devis est issu, s'il y en a un. */
  pricingConfigurationId?: string | null;
}

export interface CreateQuoteRecordResult {
  error: string | null;
  quoteId?: string;
  reference?: string;
}
