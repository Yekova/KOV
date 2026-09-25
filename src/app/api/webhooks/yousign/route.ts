import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadClientFileBuffer } from "@/lib/portal/storage";
import { downloadSignedDocument, verifyWebhookSignature } from "@/lib/yousign/client";
import { logActivity } from "@/lib/activity";
import { logLeadInteraction } from "@/lib/leads/interactions";
import { revalidateClient } from "@/lib/revalidateClient";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/brevo";
import {
  quoteSignedAdminHtml,
  quoteSignedAdminSubject,
  quoteSignedClientHtml,
  quoteSignedClientSubject,
} from "@/lib/email/quoteEmail";

// Le webhook Yousign — le seul endroit où signed_at et
// signed_pdf_storage_path sont écrits (jamais de façon optimiste depuis
// l'admin).
//
// La forme de la charge utile (event_name + data.signature_request.id) suit
// l'enveloppe documentée de Yousign v3 mais n'a jamais été confrontée à une
// livraison réelle : à confirmer le jour où un webhook est configuré.
//
// ── L'ORDRE DES OPÉRATIONS EST LE SUJET ──────────────────────────────────
//
// La version précédente téléchargeait le PDF signé AVANT d'écrire en base.
// Un échec réseau chez Yousign, un incident de stockage, et la route
// renvoyait 500 : le document était signé chez Yousign et non signé chez
// nous. La signature — l'évènement le plus important de tout le tunnel —
// se perdait en silence.
//
// Elle mettait aussi à jour sans condition. Une livraison rejouée, ce que
// Yousign fait normalement en cas de doute, réécrivait signed_at et
// DÉPLAÇAIT donc l'horodatage légal de la signature.
//
// Désormais : on écrit d'abord, sous condition, puis on récupère le PDF.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-yousign-signature") ?? request.headers.get("yousign-signature");

  const isValid = await verifyWebhookSignature(rawBody, signatureHeader);
  if (!isValid) {
    return NextResponse.json({ error: "Signature webhook invalide." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName: string = payload.event_name ?? payload.event ?? "";
  const signatureRequestId: string | undefined = payload.data?.signature_request?.id ?? payload.data?.id;

  if (!signatureRequestId) return NextResponse.json({ received: true });

  // Trois issues, pas une. Un devis refusé ou expiré restait « envoyé »
  // pour toujours, et l'admin relançait un client qui avait déjà dit non.
  const outcome = eventName.includes("done") || eventName.includes("completed")
    ? "accepted"
    : eventName.includes("declined") || eventName.includes("refused")
      ? "declined"
      : eventName.includes("expired")
        ? "expired"
        : null;

  if (!outcome) return NextResponse.json({ received: true });

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("id, client_id, lead_id, reference, recipient_name, recipient_email, total_cents")
    .eq("yousign_request_id", signatureRequestId)
    .maybeSingle();
  if (!quote) return NextResponse.json({ received: true });

  // L'horodatage vient de la charge utile quand elle le porte : c'est le
  // moment où le client a signé, pas celui où le webhook nous est parvenu.
  // Les deux peuvent différer de plusieurs minutes après une panne réseau,
  // et c'est le premier qui a une valeur juridique.
  const signedAt: string =
    payload.data?.signature_request?.signed_at ??
    payload.data?.signed_at ??
    payload.timestamp ??
    new Date().toISOString();

  if (outcome !== "accepted") {
    await supabaseAdmin
      .from("quotes")
      .update({ status: outcome, updated_at: new Date().toISOString() })
      .eq("id", quote.id)
      .eq("status", "sent");

    if (quote.client_id) revalidateClient(quote.client_id);
    revalidatePath("/admin/quotes");
    return NextResponse.json({ received: true });
  }

  // ── La garde d'idempotence ────────────────────────────────────────────
  //
  // Un compare-and-set : on n'accepte que si signed_at est encore nul. Un
  // rejeu ne modifie donc aucune ligne et ressort ici, sans avoir touché à
  // l'horodatage. C'est atomique, ça ne coûte pas une requête de plus, et
  // ça évite une table `webhook_events` avec son travail de nettoyage.
  const { data: claimed } = await supabaseAdmin
    .from("quotes")
    .update({ status: "accepted", signed_at: signedAt, updated_at: new Date().toISOString() })
    .eq("id", quote.id)
    .is("signed_at", null)
    .select("id");

  const isFirstDelivery = Boolean(claimed && claimed.length > 0);

  // ── Le PDF, après coup ────────────────────────────────────────────────
  //
  // Garde indépendante de la première : si ce second temps échoue, la
  // signature reste enregistrée et une nouvelle livraison pourra encore
  // déposer le document. C'est pour ça que la condition porte sur
  // signed_pdf_storage_path et non sur signed_at.
  try {
    const { data: current } = await supabaseAdmin
      .from("quotes")
      .select("signed_pdf_storage_path")
      .eq("id", quote.id)
      .maybeSingle();

    if (!current?.signed_pdf_storage_path) {
      const signedPdf = await downloadSignedDocument(signatureRequestId);
      const signedPdfPath = `quotes/${quote.id}-signed.pdf`;
      await uploadClientFileBuffer(signedPdfPath, signedPdf, "application/pdf");

      await supabaseAdmin
        .from("quotes")
        .update({ signed_pdf_storage_path: signedPdfPath, updated_at: new Date().toISOString() })
        .eq("id", quote.id)
        .is("signed_pdf_storage_path", null);

      if (isFirstDelivery) await notifySigned(quote, signedAt, signedPdf);
    }
  } catch {
    // Volontairement avalé : la signature est enregistrée, c'est ce qui
    // compte. Le document se récupérera à la livraison suivante, ou à la
    // main depuis Yousign.
  }

  if (isFirstDelivery) {
    if (quote.client_id) {
      await logActivity({
        clientId: quote.client_id,
        type: "quote",
        title: "Devis signé électroniquement",
        adminTitle: `Le client a signé électroniquement le devis ${quote.reference}`,
        actorId: null,
        description: `Devis ${quote.reference}`,
      });
    }

    // Le devis peut viser un lead pas encore converti : sa chronologie doit
    // porter la signature, sinon l'évènement décisif n'apparaît nulle part.
    if (quote.lead_id) {
      await logLeadInteraction({
        leadId: quote.lead_id,
        type: "proposal",
        actorId: null,
        content: `Devis ${quote.reference} signé électroniquement.`,
        metadata: { quoteId: quote.id, reference: quote.reference },
      });
    }
  }

  // Sans ça, un devis signé restait affiché « en attente de signature » des
  // deux côtés jusqu'à ce qu'une autre action provoque une revalidation.
  if (quote.client_id) revalidateClient(quote.client_id);
  revalidatePath("/admin/quotes");
  revalidatePath("/client/quotes");

  return NextResponse.json({ received: true });
}

/** Prévient le client et les administrateurs. Au mieux : un envoi raté ne
 *  doit jamais remettre en cause l'enregistrement de la signature, qui est
 *  déjà en base quand on arrive ici. */
async function notifySigned(
  quote: { reference: string; recipient_name: string; recipient_email: string | null; total_cents: number },
  signedAt: string,
  signedPdf: Buffer
) {
  const data = {
    recipientName: quote.recipient_name,
    reference: quote.reference,
    totalCents: quote.total_cents,
    signedAt,
  };

  try {
    if (quote.recipient_email) {
      await sendEmail({
        to: quote.recipient_email,
        toName: quote.recipient_name,
        subject: quoteSignedClientSubject(data),
        html: await quoteSignedClientHtml(data),
        attachments: [{ name: `${quote.reference}-signe.pdf`, content: signedPdf.toString("base64") }],
      });
    }

    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin")
      .is("archived_at", null);

    const html = await quoteSignedAdminHtml(data);
    const subject = quoteSignedAdminSubject(data);

    await Promise.allSettled(
      (admins ?? [])
        .filter((admin): admin is { email: string; full_name: string | null } => Boolean(admin.email))
        .map((admin) => sendEmail({ to: admin.email, toName: admin.full_name ?? undefined, subject, html }))
    );
  } catch {
    // Voir le contrat ci-dessus.
  }
}
