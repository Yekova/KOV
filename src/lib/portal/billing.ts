import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isInvoiceOverdue, isQuoteExpired } from "@/lib/portal/status";

// Devis et factures, dans une seule liste.
//
// Les deux vivaient sur deux écrans, avec deux entrées de menu, alors que
// ce sont deux états d'une même chose du point de vue du client : un
// montant que le studio lui annonce, puis un montant qu'il doit régler.
// Un devis devient une facture (quotes.invoice_id), donc les séparer
// obligeait à suivre un objet d'un onglet à l'autre.
//
// Ce fichier assemble les deux en une forme commune. Il ne calcule rien
// qui ne soit écrit en base : aucune TVA — la colonne n'existe pas et KOV
// est en franchise (art. 293 B du CGI) — et aucun mode de paiement, qui
// n'est stocké nulle part.

export type BillingKind = "quote" | "invoice";

export interface BillingDocument {
  id: string;
  kind: BillingKind;
  reference: string;
  projectId: string | null;
  projectName: string | null;
  /** Date d'émission (facture) ou de création (devis), en ISO. */
  date: string;
  amountCents: number;
  currency: string | null;
  /** Le statut brut, pour filtrer. */
  status: string;
  /** Ce que le client lit — voir clientStatus() plus bas. */
  statusLabel: string;
  statusColor: string;
  /** Échéance : valid_until pour un devis, due_at pour une facture. */
  dueDate: string | null;
  /** Jours restants avant l'échéance ; négatif si elle est passée. */
  dueInDays: number | null;
  /** Vrai quand le document appelle un geste du client. */
  actionable: boolean;
  archived: boolean;
  hasPdf: boolean;
  signingUrl: string | null;
  signedAt: string | null;
  paidAt: string | null;
  /** Devis seulement : le détail réellement stocké. */
  subtotalCents: number | null;
  discountCents: number | null;
  /** Facture seulement : « Acompte 40 % », « Solde ». */
  kindLabel: string | null;
  lineCount: number;
}

const AMBER = "#F5A524";
const GREEN = "#3FB27F";

// Le libellé côté client, et pourquoi il diffère de celui de l'admin.
//
// L'admin lit l'état du document dans SON flux : « Envoyé », « Accepté ».
// Le client, lui, a besoin de savoir ce qu'on attend de lui. « Envoyé »
// ne lui apprend rien — il le sait, il l'a reçu. « À signer », si.
function quoteStatus(status: string, signedAt: string | null, validUntil: string | null) {
  if (signedAt || status === "accepted") return { label: "Signé", color: GREEN, actionable: false };
  if (isQuoteExpired(status, validUntil)) return { label: "Expiré", color: "var(--kov-red)", actionable: false };
  if (status === "sent") return { label: "À signer", color: AMBER, actionable: true };
  if (status === "declined") return { label: "Refusé", color: "var(--kov-steel)", actionable: false };
  if (status === "expired") return { label: "Expiré", color: "var(--kov-steel)", actionable: false };
  if (status === "cancelled") return { label: "Annulé", color: "var(--kov-steel)", actionable: false };
  return { label: "Brouillon", color: "var(--kov-steel)", actionable: false };
}

function invoiceStatus(status: string, dueAt: string | null) {
  if (status === "paid") return { label: "Payée", color: GREEN, actionable: false };
  if (isInvoiceOverdue(status, dueAt)) return { label: "En retard", color: "var(--kov-red)", actionable: true };
  if (status === "sent") return { label: "À régler", color: AMBER, actionable: true };
  if (status === "cancelled") return { label: "Annulée", color: "var(--kov-steel)", actionable: false };
  if (status === "overdue") return { label: "En retard", color: "var(--kov-red)", actionable: true };
  return { label: "Brouillon", color: "var(--kov-steel)", actionable: false };
}

function daysUntil(due: string | null): number | null {
  if (!due) return null;
  const target = new Date(due).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86_400_000);
}

// La signature électronique, lue à part et sans faire tomber la page.
//
// quotes.signing_url et quotes.signed_at viennent de la migration
// 20260913090100, qui N'EST PAS APPLIQUÉE sur la base de production
// (vérifié : les sept colonnes de invoice_id, yousign_* et signed_* y
// manquent). Les sélectionner dans la requête principale faisait échouer
// TOUTE la requête — c'est exactement ce qui se passait sur l'ancienne
// page /client/quotes, qui affichait « Aucun devis pour l'instant » à un
// client qui en avait.
//
// Une requête séparée dégrade donc au bon endroit : sans les colonnes, on
// perd le lien de signature, pas la liste des devis. Et le jour où la
// migration est appliquée, la signature réapparaît sans toucher à une
// ligne de code.
async function getQuoteSignatureState(
  clientId: string
): Promise<Map<string, { signingUrl: string | null; signedAt: string | null }>> {
  const map = new Map<string, { signingUrl: string | null; signedAt: string | null }>();
  const { data, error } = await supabaseAdmin
    .from("quotes")
    .select("id, signing_url, signed_at")
    .eq("client_id", clientId);
  if (error || !data) return map;
  for (const row of data) map.set(row.id, { signingUrl: row.signing_url, signedAt: row.signed_at });
  return map;
}

export interface BillingData {
  documents: BillingDocument[];
  /** Somme des factures envoyées et non réglées. */
  outstandingCents: number;
  paidThisMonthCents: number;
  paidLastMonthCents: number;
  quotesToSign: number;
  invoicesToPay: number;
  currency: string;
}

export async function getClientBilling(clientId: string): Promise<BillingData> {
  const [{ data: quotes }, { data: invoices }, { data: projects }] = await Promise.all([
    supabaseAdmin
      .from("quotes")
      .select(
        "id, reference, project_id, total_cents, subtotal_cents, discount_cents, status, valid_until, created_at, pdf_storage_path, line_items"
      )
      .eq("client_id", clientId)
      // Un brouillon n'a pas été envoyé : le client ne doit pas le voir,
      // et rien d'autre ne l'en empêchait jusqu'ici.
      .neq("status", "draft")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("invoices")
      .select(
        "id, reference, project_id, amount_cents, currency, status, due_at, issued_at, paid_at, pdf_storage_path, kind, deposit_percent, line_items"
      )
      .eq("client_id", clientId)
      .neq("status", "draft")
      .order("issued_at", { ascending: false }),
    supabaseAdmin.from("projects").select("id, name").eq("client_id", clientId),
  ]);

  const signature = await getQuoteSignatureState(clientId);
  const projectNameById = new Map((projects ?? []).map((project) => [project.id, project.name]));
  const lineCount = (value: unknown) => (Array.isArray(value) ? value.length : 0);

  const quoteDocuments: BillingDocument[] = (quotes ?? []).map((quote) => {
    const state = quoteStatus(quote.status, signature.get(quote.id)?.signedAt ?? null, quote.valid_until);
    return {
      id: quote.id,
      kind: "quote",
      reference: quote.reference,
      projectId: quote.project_id,
      projectName: quote.project_id ? (projectNameById.get(quote.project_id) ?? null) : null,
      date: quote.created_at,
      amountCents: quote.total_cents,
      currency: "EUR",
      status: quote.status,
      statusLabel: state.label,
      statusColor: state.color,
      dueDate: quote.valid_until,
      dueInDays: daysUntil(quote.valid_until),
      actionable: state.actionable,
      archived: ["declined", "expired", "cancelled"].includes(quote.status) || isQuoteExpired(quote.status, quote.valid_until),
      hasPdf: Boolean(quote.pdf_storage_path),
      signingUrl: signature.get(quote.id)?.signingUrl ?? null,
      signedAt: signature.get(quote.id)?.signedAt ?? null,
      paidAt: null,
      subtotalCents: quote.subtotal_cents,
      discountCents: quote.discount_cents,
      kindLabel: null,
      lineCount: lineCount(quote.line_items),
    };
  });

  const invoiceDocuments: BillingDocument[] = (invoices ?? []).map((invoice) => {
    const state = invoiceStatus(invoice.status, invoice.due_at);
    return {
      id: invoice.id,
      kind: "invoice",
      reference: invoice.reference,
      projectId: invoice.project_id,
      projectName: invoice.project_id ? (projectNameById.get(invoice.project_id) ?? null) : null,
      date: invoice.issued_at,
      amountCents: invoice.amount_cents,
      currency: invoice.currency,
      status: invoice.status,
      statusLabel: state.label,
      statusColor: state.color,
      dueDate: invoice.due_at,
      dueInDays: daysUntil(invoice.due_at),
      actionable: state.actionable,
      archived: invoice.status === "cancelled",
      hasPdf: Boolean(invoice.pdf_storage_path),
      signingUrl: null,
      signedAt: null,
      paidAt: invoice.paid_at,
      subtotalCents: null,
      discountCents: null,
      kindLabel:
        invoice.kind === "deposit"
          ? `Acompte${invoice.deposit_percent ? ` ${invoice.deposit_percent} %` : ""}`
          : invoice.kind === "balance"
            ? "Solde"
            : null,
      lineCount: lineCount(invoice.line_items),
    };
  });

  const documents = [...quoteDocuments, ...invoiceDocuments].sort((a, b) => b.date.localeCompare(a.date));

  // Des sommes, pas des estimations. paid_at existe depuis la migration
  // 20260819110200, donc la comparaison mensuelle est un fait.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  let outstandingCents = 0;
  let paidThisMonthCents = 0;
  let paidLastMonthCents = 0;
  for (const invoice of invoices ?? []) {
    if (invoice.status === "sent") outstandingCents += invoice.amount_cents;
    if (invoice.status === "paid" && invoice.paid_at) {
      const paidAt = new Date(invoice.paid_at).getTime();
      if (paidAt >= monthStart) paidThisMonthCents += invoice.amount_cents;
      else if (paidAt >= previousMonthStart) paidLastMonthCents += invoice.amount_cents;
    }
  }

  return {
    documents,
    outstandingCents,
    paidThisMonthCents,
    paidLastMonthCents,
    quotesToSign: quoteDocuments.filter((doc) => doc.actionable).length,
    invoicesToPay: invoiceDocuments.filter((doc) => doc.actionable).length,
    currency: (invoices ?? [])[0]?.currency ?? "EUR",
  };
}
