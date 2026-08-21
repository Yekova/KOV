"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadClientFileBuffer, createSignedDownloadUrl } from "@/lib/portal/storage";
import { generateQuotePdfBuffer } from "@/lib/billing/generatePdf";
import { sendEmail } from "@/lib/email/brevo";
import { quoteEmailHtml, quoteEmailSubject } from "@/lib/email/quoteEmail";
import { isQuoteStatus } from "@/lib/portal/status";
import { toDbLineItems } from "@/lib/billing/quoteLineItems";
import type { QuoteLineItem } from "@/lib/billing/QuoteDocument";

function parseLineItems(raw: FormDataEntryValue | null): QuoteLineItem[] {
  if (typeof raw !== "string" || !raw.trim()) throw new Error("Au moins une ligne de devis est requise.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Lignes de devis invalides.");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Au moins une ligne de devis est requise.");

  return parsed.map((item): QuoteLineItem => {
    const description = typeof item?.description === "string" ? item.description.trim() : "";
    const quantity = Number(item?.quantity);
    const unitPriceCents = Math.round(Number(item?.unitPriceEur) * 100);
    if (!description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPriceCents) || unitPriceCents < 0) {
      throw new Error("Lignes de devis invalides.");
    }
    return { description, quantity, unitPriceCents };
  });
}

function parseEuroToCents(value: FormDataEntryValue | null): number {
  if (typeof value !== "string" || !value.trim()) return 0;
  const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
  return Number.isFinite(cents) && cents >= 0 ? cents : 0;
}

export async function createQuote(formData: FormData) {
  await requireAdmin();

  const reference = formData.get("reference");
  const recipientName = formData.get("recipient_name");
  const recipientEmail = formData.get("recipient_email");
  const clientId = formData.get("client_id");
  const leadId = formData.get("lead_id");
  const validUntil = formData.get("valid_until");
  const discountEur = formData.get("discount_eur");

  if (typeof reference !== "string" || !reference.trim()) throw new Error("Référence requise.");
  if (typeof recipientName !== "string" || !recipientName.trim()) throw new Error("Nom du destinataire requis.");

  const lineItems = parseLineItems(formData.get("line_items"));
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const discountCents = Math.min(subtotalCents, parseEuroToCents(discountEur));
  const totalCents = subtotalCents - discountCents;

  const clientIdValue = typeof clientId === "string" && clientId ? clientId : null;
  const leadIdValue = typeof leadId === "string" && leadId ? leadId : null;
  const recipientEmailValue = typeof recipientEmail === "string" && recipientEmail.trim() ? recipientEmail.trim() : null;
  const validUntilValue = typeof validUntil === "string" && validUntil ? validUntil : null;

  const quoteId = crypto.randomUUID();

  const pdfBuffer = await generateQuotePdfBuffer({
    reference: reference.trim(),
    createdAt: new Date().toISOString(),
    validUntil: validUntilValue,
    recipientName: recipientName.trim(),
    recipientEmail: recipientEmailValue,
    lineItems,
    subtotalCents,
    discountCents,
    totalCents,
  });

  const pdfPath = `quotes/${quoteId}.pdf`;
  await uploadClientFileBuffer(pdfPath, pdfBuffer, "application/pdf");

  const { error } = await supabaseAdmin.from("quotes").insert({
    id: quoteId,
    client_id: clientIdValue,
    lead_id: leadIdValue,
    reference: reference.trim(),
    recipient_name: recipientName.trim(),
    recipient_email: recipientEmailValue,
    line_items: toDbLineItems(lineItems),
    subtotal_cents: subtotalCents,
    discount_cents: discountCents,
    total_cents: totalCents,
    valid_until: validUntilValue,
    pdf_storage_path: pdfPath,
  });

  if (error) throw new Error("La création du devis a échoué (référence déjà utilisée ?).");

  revalidatePath("/admin/quotes");
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  await requireAdmin();

  if (!isQuoteStatus(status)) throw new Error("Statut invalide.");

  const { error } = await supabaseAdmin
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw new Error("La mise à jour a échoué.");

  revalidatePath("/admin/quotes");
}

export async function sendQuoteEmail(quoteId: string) {
  await requireAdmin();

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("recipient_name, recipient_email, reference, total_cents, valid_until, status")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) throw new Error("Devis introuvable.");
  if (!quote.recipient_email) throw new Error("Ce devis n'a pas d'adresse email destinataire.");

  const pdfPath = `quotes/${quoteId}.pdf`;
  const signedUrl = await createSignedDownloadUrl(pdfPath);
  if (!signedUrl) throw new Error("PDF du devis introuvable — recréez le devis.");

  const pdfResponse = await fetch(signedUrl);
  if (!pdfResponse.ok) throw new Error("Le téléchargement du PDF a échoué.");
  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

  const emailData = {
    recipientName: quote.recipient_name,
    reference: quote.reference,
    totalCents: quote.total_cents,
    validUntil: quote.valid_until,
  };

  await sendEmail({
    to: quote.recipient_email,
    toName: quote.recipient_name,
    subject: quoteEmailSubject(emailData),
    html: quoteEmailHtml(emailData),
    attachments: [{ name: `${quote.reference}.pdf`, content: pdfBuffer.toString("base64") }],
  });

  const { error } = await supabaseAdmin
    .from("quotes")
    .update({
      sent_at: new Date().toISOString(),
      status: quote.status === "draft" ? "sent" : quote.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId);
  if (error) throw new Error("L'enregistrement après envoi a échoué.");

  revalidatePath("/admin/quotes");
}

export async function downloadQuotePdf(formData: FormData) {
  await requireAdmin();

  const quoteId = formData.get("quote_id");
  if (typeof quoteId !== "string" || !quoteId) throw new Error("Devis invalide.");

  const { data: quote } = await supabaseAdmin.from("quotes").select("reference").eq("id", quoteId).maybeSingle();

  const url = await createSignedDownloadUrl(`quotes/${quoteId}.pdf`, 60, `${quote?.reference ?? quoteId}.pdf`);
  if (!url) throw new Error("Le téléchargement a échoué.");

  redirect(url);
}

// Returns an inline-viewable signed URL (no Content-Disposition: attachment)
// so the client can open it in a new tab without leaving the quotes list.
export async function getQuotePdfUrl(quoteId: string): Promise<string> {
  await requireAdmin();

  const url = await createSignedDownloadUrl(`quotes/${quoteId}.pdf`);
  if (!url) throw new Error("Aperçu indisponible.");

  return url;
}
