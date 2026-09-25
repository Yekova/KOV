import { timingSafeEqual } from "node:crypto";
import "server-only";

// Thin wrapper around Yousign's v3 REST API (signature_requests), isolated
// in this one file so it's easy to adjust once tested against a real
// Yousign account — I have no Yousign API key or sandbox access here, so
// none of this has been exercised against the live API. The v3
// signature_requests flow (create request → upload document → add signer →
// activate) is Yousign's documented, stable pattern, but exact field/param
// names below should be double-checked against https://developers.yousign.com
// once real credentials exist, especially the signer field's page/x/y
// placement, which is the part most likely to need tuning per real PDF
// layout.
const YOUSIGN_API_URL = process.env.YOUSIGN_API_URL ?? "https://api.yousign.app/v3";

function getApiKey(): string {
  const key = process.env.YOUSIGN_API_KEY;
  if (!key) throw new Error("YOUSIGN_API_KEY manquant.");
  return key;
}

async function yousignFetch(path: string, init: RequestInit) {
  const response = await fetch(`${YOUSIGN_API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${getApiKey()}`, ...init.headers },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Yousign (${response.status}) ${path}: ${body}`);
  }
  return response.json();
}

export interface CreateSignatureRequestParams {
  name: string;
  pdfBuffer: Buffer;
  filename: string;
  signer: { firstName: string; lastName: string; email: string };
}

export interface SignatureRequestResult {
  signatureRequestId: string;
  signerId: string;
  signingUrl: string;
}

// Creates a draft request, uploads the quote PDF, adds the client as the
// sole signer, then activates it — Yousign returns the signer's own
// signing link (delivery_mode "none": we deliver it ourselves, via the
// client portal and/or the quote email, rather than Yousign emailing it).
export async function createSignatureRequest(params: CreateSignatureRequestParams): Promise<SignatureRequestResult> {
  const request = await yousignFetch("/signature_requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: params.name, delivery_mode: "none" }),
  });
  const signatureRequestId: string = request.id;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(params.pdfBuffer)], { type: "application/pdf" }), params.filename);
  form.append("nature", "signable_document");
  const document = await yousignFetch(`/signature_requests/${signatureRequestId}/documents`, {
    method: "POST",
    body: form,
  });
  const documentId: string = document.id;

  // Signature field placed near the bottom-right of the last page — a
  // reasonable default for a quote PDF, but the exact x/y may need
  // adjusting once checked against this codebase's real QuoteDocument.tsx
  // layout (src/lib/billing/QuoteDocument.tsx) with a real Yousign account.
  const signer = await yousignFetch(`/signature_requests/${signatureRequestId}/signers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      info: {
        first_name: params.signer.firstName,
        last_name: params.signer.lastName,
        email: params.signer.email,
        locale: "fr",
      },
      signature_level: "electronic_signature",
      signature_authentication_mode: "no_otp",
      fields: [{ document_id: documentId, type: "signature", page: -1, x: 380, y: 700 }],
    }),
  });
  const signerId: string = signer.id;
  const signingUrl: string = signer.signature_link;

  await yousignFetch(`/signature_requests/${signatureRequestId}/activate`, { method: "POST" });

  return { signatureRequestId, signerId, signingUrl };
}

export async function downloadSignedDocument(signatureRequestId: string): Promise<Buffer> {
  const response = await fetch(`${YOUSIGN_API_URL}/signature_requests/${signatureRequestId}/documents/download`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!response.ok) throw new Error(`Yousign: le téléchargement du document signé a échoué (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
}

// Yousign signs webhook payloads with HMAC-SHA256 over the raw request
// body, using a per-webhook secret configured in the Yousign dashboard
// (YOUSIGN_WEBHOOK_SECRET) — verify this before trusting any webhook
// payload, same principle as any other externally-triggered write.
export async function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const secret = process.env.YOUSIGN_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computed = Buffer.from(signatureBuffer);
  const provided = Buffer.from(signatureHeader, "hex");

  // timingSafeEqual et non === : une comparaison de chaînes s'arrête au
  // premier caractère différent, donc sa durée révèle combien de caractères
  // de tête sont corrects. Répétée, elle laisse reconstruire la signature
  // octet par octet. La fonction exige deux tampons de même longueur, d'où
  // le test préalable — qui, lui, ne fuite que la longueur, publique.
  if (computed.length !== provided.length) return false;
  return timingSafeEqual(computed, provided);
}
