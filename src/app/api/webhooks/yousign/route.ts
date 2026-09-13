import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadClientFileBuffer } from "@/lib/portal/storage";
import { downloadSignedDocument, verifyWebhookSignature } from "@/lib/yousign/client";
import { logActivity } from "@/lib/activity";

// Yousign's webhook — the only place signed_at/signed_pdf_storage_path
// are ever set (never optimistically from the admin side). Payload shape
// below (event_name + data.signature_request.id) matches Yousign v3's
// documented event envelope, but hasn't been exercised against a real
// webhook delivery here — worth confirming against the actual payload
// once a Yousign webhook is configured and fires for real.
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

  // Only react to the request reaching full completion (every signer
  // done), not an individual signer event — a quote here only ever has one
  // signer, but this stays correct if that ever changes.
  const isCompleted = eventName.includes("done") || eventName.includes("completed");
  if (!isCompleted) return NextResponse.json({ received: true });

  const { data: quote } = await supabaseAdmin
    .from("quotes")
    .select("id, client_id, reference")
    .eq("yousign_request_id", signatureRequestId)
    .maybeSingle();
  if (!quote) return NextResponse.json({ received: true });

  const signedPdf = await downloadSignedDocument(signatureRequestId);
  const signedPdfPath = `quotes/${quote.id}-signed.pdf`;
  await uploadClientFileBuffer(signedPdfPath, signedPdf, "application/pdf");

  await supabaseAdmin
    .from("quotes")
    .update({
      status: "accepted",
      signed_at: new Date().toISOString(),
      signed_pdf_storage_path: signedPdfPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quote.id);

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

  return NextResponse.json({ received: true });
}
