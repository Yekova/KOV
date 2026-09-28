import "server-only";
import type { SendEmailInput } from "@/lib/email/provider";

// Le garde-fou : hors production, rien ne part chez un vrai client.
//
// C'est le risque le plus concret de tout ce chantier. Un moteur de
// relances qu'on met au point envoie de vrais emails à de vrais clients
// pendant qu'on le teste — quinze relances à Maison Dupont parce qu'une
// boucle avait un jour d'écart. Ça ne se répare pas après coup.
//
// ── COMMENT ÇA DÉCIDE ────────────────────────────────────────────────
//
// EMAIL_SAFE_MODE l'emporte toujours quand elle est posée explicitement.
// Quand elle ne l'est pas, le mode sûr est ACTIF partout sauf en
// production : un environnement de test qui oublie de se déclarer doit
// se taire, pas écrire aux clients. C'est le sens du défaut qui compte
// ici — l'erreur d'inattention doit tomber du côté prudent.
//
// En mode sûr, l'email n'est pas annulé : il est REDIRIGÉ vers l'adresse
// de test, avec son sujet préfixé et le vrai destinataire écrit en tête du
// corps. On voit donc exactement ce qui serait parti, et à qui — ce qu'un
// envoi purement supprimé ne montre pas.

const TEST_PREFIX = "[TEST KOV]";

export function isSafeModeEnabled(): boolean {
  const explicit = process.env.EMAIL_SAFE_MODE?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  // Non déclaré : sûr partout sauf en production.
  return process.env.NODE_ENV !== "production";
}

export function safeModeRecipient(): string | null {
  const recipient = process.env.EMAIL_TEST_RECIPIENT?.trim();
  return recipient || null;
}

export class SafeModeWithoutRecipientError extends Error {
  constructor() {
    super(
      "Mode sûr actif mais EMAIL_TEST_RECIPIENT n'est pas défini : l'email n'est pas parti. " +
        "Posez une adresse de test, ou EMAIL_SAFE_MODE=false pour envoyer réellement."
    );
    this.name = "SafeModeWithoutRecipientError";
  }
}

/** Réécrit un envoi pour le mode sûr. Rend l'entrée telle quelle si le mode
 *  est inactif. Lève si le mode est actif sans adresse de test — se taire
 *  silencieusement laisserait croire que l'email est parti. */
export function applySafeMode(input: SendEmailInput): SendEmailInput {
  if (!isSafeModeEnabled()) return input;

  const recipient = safeModeRecipient();
  if (!recipient) throw new SafeModeWithoutRecipientError();

  const banner =
    `<div style="background:#111;color:#fff;font:13px/1.5 system-ui,sans-serif;padding:12px 16px;margin-bottom:16px">` +
    `<strong>${TEST_PREFIX}</strong> — destinataire réel : ${escapeHtml(input.toName ? `${input.toName} <${input.to}>` : input.to)}` +
    `</div>`;

  return {
    ...input,
    to: recipient,
    toName: undefined,
    subject: `${TEST_PREFIX} ${input.subject}`,
    html: banner + input.html,
    text: input.text ? `${TEST_PREFIX} destinataire réel : ${input.to}\n\n${input.text}` : undefined,
  };
}

// Le destinataire réel est écrit dans du HTML : il vient d'une base et peut
// contenir n'importe quoi. Il est échappé, comme tout ce qui vient de
// l'extérieur.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
