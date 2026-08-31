"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadClientFile, uploadClientFileBuffer, createSignedDownloadUrl, deleteClientFile } from "@/lib/portal/storage";
import { logActivity, getActorDisplayName } from "@/lib/activity";
import { generateQuotePdfBuffer } from "@/lib/billing/generatePdf";
import { sendEmail } from "@/lib/email/brevo";
import { quoteEmailHtml, quoteEmailSubject } from "@/lib/email/quoteEmail";
import { isQuoteStatus, QUOTE_STATUS_LABELS, isInvoiceKind, type InvoiceKind } from "@/lib/portal/status";
import { toDbLineItems, fromDbLineItems, parseLineItemsFromForm } from "@/lib/billing/quoteLineItems";
import { generateInvoicePdfBuffer } from "@/lib/billing/generatePdf";
import { revalidateClient } from "@/lib/revalidateClient";

function parseEuroToCents(value: FormDataEntryValue | null): number {
  if (typeof value !== "string" || !value.trim()) return 0;
  const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
  return Number.isFinite(cents) && cents >= 0 ? cents : 0;
}

// Distinct from parseEuroToCents above: that one treats empty/invalid as 0
// (fine for an optional discount), this treats it as invalid — the
// conversion form's amount is required, same as the standalone invoice form.
function parseRequiredEuroToCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
  return Number.isFinite(cents) && cents >= 0 ? cents : null;
}

export async function createQuote(formData: FormData) {
  const admin = await requireAdmin();

  const reference = formData.get("reference");
  const recipientName = formData.get("recipient_name");
  const recipientEmail = formData.get("recipient_email");
  const clientId = formData.get("client_id");
  const leadId = formData.get("lead_id");
  const validUntil = formData.get("valid_until");
  const discountEur = formData.get("discount_eur");

  if (typeof reference !== "string" || !reference.trim()) throw new Error("Référence requise.");
  if (typeof recipientName !== "string" || !recipientName.trim()) throw new Error("Nom du destinataire requis.");

  const lineItems = parseLineItemsFromForm(formData.get("line_items"));
  if (lineItems.length === 0) throw new Error("Au moins une ligne de devis est requise.");
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const discountCents = Math.min(subtotalCents, parseEuroToCents(discountEur));
  const totalCents = subtotalCents - discountCents;

  const clientIdValue = typeof clientId === "string" && clientId ? clientId : null;
  const leadIdValue = typeof leadId === "string" && leadId ? leadId : null;
  const recipientEmailValue = typeof recipientEmail === "string" && recipientEmail.trim() ? recipientEmail.trim() : null;
  const validUntilValue = typeof validUntil === "string" && validUntil ? validUntil : null;

  const quoteId = crypto.randomUUID();
  const pdfPath = `quotes/${quoteId}.pdf`;

  const pdfFile = formData.get("pdf_file");
  if (pdfFile instanceof File && pdfFile.size > 0) {
    // Admin supplied their own PDF (e.g. a custom-formatted devis) — use it
    // as-is instead of generating one from the template. The line items
    // above still drive the stored subtotal/total shown in the app and email.
    if (pdfFile.type !== "application/pdf") throw new Error("Le fichier personnalisé doit être un PDF.");
    await uploadClientFile(pdfPath, pdfFile);
  } else {
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
    await uploadClientFileBuffer(pdfPath, pdfBuffer, "application/pdf");
  }

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

  if (clientIdValue) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: clientIdValue,
      type: "quote",
      title: "Devis créé",
      adminTitle: `${actorName} a créé le devis ${reference.trim()}`,
      actorId: admin.id,
      description: `Devis ${reference.trim()}`,
    });
  }

  revalidatePath("/admin/quotes");
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  const admin = await requireAdmin();

  if (!isQuoteStatus(status)) throw new Error("Statut invalide.");

  const { data: existing } = await supabaseAdmin.from("quotes").select("client_id, reference").eq("id", quoteId).maybeSingle();
  if (!existing) throw new Error("Devis introuvable.");

  const { error } = await supabaseAdmin
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw new Error("La mise à jour a échoué.");

  if (existing.client_id) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: existing.client_id,
      type: "quote",
      title: `Devis ${QUOTE_STATUS_LABELS[status as keyof typeof QUOTE_STATUS_LABELS]?.toLowerCase() ?? status}`,
      adminTitle: `${actorName} a changé le statut du devis ${existing.reference} → ${status}`,
      actorId: admin.id,
    });
  }

  revalidatePath("/admin/quotes");
}

// A quote created against a lead only (no client account at creation time —
// client_id is nullable specifically for that case, see quotes' own
// migration comment) can never qualify for "Convertir en facture"
// (invoices.client_id is NOT NULL) until it's linked to a real client.
// This is the only way to set client_id after creation — there was none
// before, a real gap the quote→invoice conversion feature exposed.
export async function linkQuoteToClient(quoteId: string, clientId: string) {
  const admin = await requireAdmin();

  const { data: quote } = await supabaseAdmin.from("quotes").select("client_id, reference").eq("id", quoteId).maybeSingle();
  if (!quote) throw new Error("Devis introuvable.");
  if (quote.client_id) throw new Error("Ce devis est déjà lié à un client.");

  const { data: client } = await supabaseAdmin.from("profiles").select("id").eq("id", clientId).eq("role", "client").maybeSingle();
  if (!client) throw new Error("Client introuvable.");

  const { error } = await supabaseAdmin
    .from("quotes")
    .update({ client_id: clientId, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw new Error("La liaison au client a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId,
    type: "quote",
    title: "Devis lié à votre compte",
    adminTitle: `${actorName} a lié le devis ${quote.reference} à un client`,
    actorId: admin.id,
    description: `Devis ${quote.reference}`,
  });

  revalidateClient(clientId);
}

export async function deleteQuote(quoteId: string) {
  const admin = await requireAdmin();

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("client_id, reference, status, pdf_storage_path")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) throw new Error("Devis introuvable.");
  if (quote.status === "accepted") throw new Error("Un devis accepté ne peut pas être supprimé — annulez-le si besoin de le retirer.");

  const { error } = await supabaseAdmin.from("quotes").delete().eq("id", quoteId);
  if (error) throw new Error("La suppression a échoué.");

  if (quote.pdf_storage_path) await deleteClientFile(quote.pdf_storage_path);

  if (quote.client_id) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: quote.client_id,
      type: "quote",
      title: "Devis supprimé",
      adminTitle: `${actorName} a supprimé le devis ${quote.reference}`,
      actorId: admin.id,
    });
  }

  revalidatePath("/admin/quotes");
}

export async function sendQuoteEmail(quoteId: string) {
  const admin = await requireAdmin();

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("client_id, recipient_name, recipient_email, reference, total_cents, valid_until, status")
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
    html: await quoteEmailHtml(emailData),
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

  if (quote.client_id) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: quote.client_id,
      type: "quote",
      title: "Devis envoyé par email",
      adminTitle: `${actorName} a envoyé le devis ${quote.reference} par email`,
      actorId: admin.id,
      description: `Devis ${quote.reference} → ${quote.recipient_email}`,
    });
  }

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

// Turns an accepted quote into a real invoice — a fresh PDF generated from
// the quote's own line items, not a reuse of the devis PDF (different
// document, different title). Requires the quote to already be linked to a
// client account: invoices.client_id is NOT NULL, so a quote still only
// addressed to a lead (recipient_name/email, no client_id) can't convert
// until that lead becomes a real client.
export async function convertQuoteToInvoice(quoteId: string, formData: FormData) {
  const admin = await requireAdmin();

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("client_id, project_id, reference, recipient_name, recipient_email, line_items, status, invoice_id")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) throw new Error("Devis introuvable.");
  if (quote.invoice_id) throw new Error("Ce devis a déjà été converti en facture.");

  const clientId = quote.client_id;
  if (!clientId) throw new Error("Ce devis doit être lié à un client existant avant de pouvoir être converti en facture.");

  const reference = formData.get("reference");
  const amount = formData.get("amount_eur");
  const dueAt = formData.get("due_at");
  const kind = formData.get("kind");
  const depositPercent = formData.get("deposit_percent");
  const totalProject = formData.get("total_project_eur");

  if (typeof reference !== "string" || !reference.trim()) throw new Error("Référence requise.");

  const amountCents = parseRequiredEuroToCents(amount);
  if (amountCents === null) throw new Error("Montant invalide.");

  const kindValue: InvoiceKind = typeof kind === "string" && isInvoiceKind(kind) ? kind : "full";
  const depositPercentValue =
    kindValue === "deposit" && typeof depositPercent === "string" && depositPercent
      ? Math.min(100, Math.max(1, parseInt(depositPercent, 10) || 0))
      : null;
  const totalProjectCents = kindValue !== "full" ? parseEuroToCents(totalProject) || null : null;
  const dueAtValue = typeof dueAt === "string" && dueAt ? new Date(dueAt).toISOString() : null;
  const lineItems = fromDbLineItems(quote.line_items);

  const { data: client } = await supabaseAdmin.from("profiles").select("full_name, company, email").eq("id", clientId).maybeSingle();

  const invoiceId = crypto.randomUUID();
  const pdfPath = `${clientId}/invoices/${invoiceId}.pdf`;
  const issuedAt = new Date().toISOString();

  const pdfBuffer = await generateInvoicePdfBuffer({
    reference: reference.trim(),
    issuedAt,
    dueAt: dueAtValue,
    kind: kindValue,
    depositPercent: depositPercentValue,
    totalProjectCents,
    amountCents,
    clientName: client?.full_name || quote.recipient_name,
    clientCompany: client?.company ?? null,
    clientEmail: client?.email ?? quote.recipient_email,
    projectName: null,
    lineItems,
  });
  await uploadClientFileBuffer(pdfPath, pdfBuffer, "application/pdf");

  const { error: invoiceError } = await supabaseAdmin.from("invoices").insert({
    id: invoiceId,
    client_id: clientId,
    project_id: quote.project_id,
    reference: reference.trim(),
    amount_cents: amountCents,
    status: "sent",
    pdf_storage_path: pdfPath,
    issued_at: issuedAt,
    due_at: dueAtValue,
    kind: kindValue,
    deposit_percent: depositPercentValue,
    total_project_cents: totalProjectCents,
    line_items: toDbLineItems(lineItems),
  });
  if (invoiceError) throw new Error("La création de la facture a échoué (référence déjà utilisée ?).");

  const { error: quoteError } = await supabaseAdmin
    .from("quotes")
    .update({ invoice_id: invoiceId, status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (quoteError) throw new Error("La liaison du devis à la facture a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId,
    projectId: quote.project_id,
    type: "invoice",
    title: "Facture émise",
    adminTitle: `${actorName} a converti le devis ${quote.reference} en facture ${reference.trim()}`,
    actorId: admin.id,
    description: `Facture ${reference.trim()} (depuis le devis ${quote.reference})`,
  });

  revalidateClient(clientId);
}
