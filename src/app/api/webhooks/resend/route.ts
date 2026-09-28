import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Ce que Resend nous apprend après l'envoi.
//
// email_logs porte déjà provider_message_id, delivered_at, opened_at,
// clicked_at et failed_at — et rien ne les remplissait : une fois l'email
// parti, son sort était invisible depuis KOV. Il fallait ouvrir le tableau
// de bord de Resend pour savoir si un devis avait seulement été reçu.
//
// ── POURQUOI CETTE ROUTE FAIT SI PEU ─────────────────────────────────
//
// Un webhook doit répondre vite et ne jamais faire échouer l'émetteur.
// Resend réessaie sur erreur, donc un traitement lourd ici se paie en
// rejeux. On vérifie, on écrit un champ, on répond 200.
//
// ── IDEMPOTENCE ──────────────────────────────────────────────────────
//
// Chaque évènement n'écrit QUE sa propre colonne, et seulement si elle est
// encore vide (`is null` dans le where). Un rejeu ne déplace donc aucun
// horodatage : « ouvert à 10 h 18 » reste 10 h 18 même si Resend renvoie
// l'évènement trois fois. C'est la même garde que le webhook Yousign, et
// elle ne coûte pas de table d'évènements.
//
// ── CE QUI MANQUE, ET POURQUOI ───────────────────────────────────────
//
// Le brief demande une table email_events qui conserve les charges utiles
// brutes pour audit. Elle demande une migration, donc elle n'est pas ici :
// voir supabase/migrations/…_create_email_events.sql, à appliquer par le
// propriétaire. Sans elle on perd l'historique fin, pas le statut.

export const runtime = "nodejs";

/** Ce que chaque évènement met à jour, et rien d'autre. */
const EVENT_FIELD: Record<string, { column: string; status: string } | undefined> = {
  "email.sent": { column: "sent_at", status: "sent" },
  "email.delivered": { column: "delivered_at", status: "delivered" },
  "email.opened": { column: "opened_at", status: "delivered" },
  "email.clicked": { column: "clicked_at", status: "delivered" },
  "email.bounced": { column: "failed_at", status: "bounced" },
  "email.complained": { column: "failed_at", status: "bounced" },
  "email.delivery_delayed": undefined,
};

// Resend signe avec Svix : un identifiant, un horodatage, et une signature
// calculée sur « id.timestamp.body ». La comparaison est en temps constant —
// une comparaison par === fuit la position du premier octet faux, ce qui
// suffit à reconstruire une signature valide octet par octet.
function verifySignature(request: NextRequest, rawBody: string, secret: string): boolean {
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signatureHeader = request.headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  // Une signature vieille de plus de cinq minutes est refusée : sans ça,
  // une charge utile interceptée reste rejouable indéfiniment.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  // Le secret est transmis préfixé et encodé en base64.
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");

  // L'en-tête peut porter plusieurs signatures (rotation de secret) :
  // « v1,xxxx v1,yyyy ».
  return signatureHeader.split(" ").some((part) => {
    const value = part.split(",")[1];
    if (!value) return false;
    const a = Buffer.from(value);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // Pas configuré : on refuse plutôt que d'accepter n'importe quoi. Un
    // webhook non vérifié laisserait n'importe qui écrire dans email_logs.
    return NextResponse.json({ error: "webhook non configuré" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!verifySignature(request, rawBody, secret)) {
    return NextResponse.json({ error: "signature invalide" }, { status: 401 });
  }

  let payload: { type?: string; data?: { email_id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "charge utile illisible" }, { status: 400 });
  }

  const type = payload.type ?? "";
  const emailId = payload.data?.email_id;
  const mapping = EVENT_FIELD[type];

  // Un évènement qu'on ne suit pas n'est pas une erreur : répondre autre
  // chose que 200 ferait réessayer Resend pour rien.
  if (!mapping || !emailId) return NextResponse.json({ ok: true, ignored: type });

  const now = new Date().toISOString();

  const { data: updated } = await supabaseAdmin
    .from("email_logs")
    .update({ [mapping.column]: now, status: mapping.status })
    .eq("provider_message_id", emailId)
    // La garde d'idempotence : on ne réécrit pas un horodatage déjà posé,
    // donc un rejeu ne déplace pas la date du premier évènement.
    .is(mapping.column, null)
    .select("id");

  return NextResponse.json({ ok: true, matched: updated?.length ?? 0 });
}
