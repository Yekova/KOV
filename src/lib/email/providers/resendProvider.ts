import "server-only";
import type {
  EmailProvider,
  SendEmailInput,
  SendEmailResult,
  ProviderMessageStatus,
} from "@/lib/email/provider";

// Resend, derrière l'interface EmailProvider.
//
// Appel REST direct, comme brevo.ts : l'API d'envoi tient en un POST JSON,
// et le SDK n'apporterait qu'une dépendance de plus à tenir à jour.
//
// ── DEUX CHOSES QUE BREVO NE SAIT PAS FAIRE ICI ──────────────────────────
//
// 1. L'IDEMPOTENCE. Resend accepte un en-tête Idempotency-Key et déduplique
//    pendant 24 h. C'est exactement ce qu'il faut à un moteur de relances :
//    un cron rejoué, un déploiement pendant l'exécution, un timeout suivi
//    d'une reprise — aucun de ces cas ne doit envoyer deux fois la même
//    relance à un client. La clé est fournie par l'appelant, qui est le
//    seul à savoir ce que « la même relance » veut dire.
//
// 2. LE STATUT SYNCHRONE. Resend expose GET /emails/:id avec un last_event.
//    getStatus() est donc réellement implémentable, là où l'implémentation
//    Brevo doit rendre "unknown" faute d'endpoint à interroger.

const RESEND_API_URL = "https://api.resend.com/emails";

// Les évènements de Resend, ramenés au vocabulaire de l'interface.
// `queued` et `delivery_delayed` se lisent « parti, pas encore arrivé » :
// les distinguer ne changerait rien à ce qu'on en fait, et `canceled` n'est
// atteignable que via l'API d'annulation, que ce projet n'utilise pas.
const EVENT_MAP: Record<string, ProviderMessageStatus> = {
  sent: "sent",
  queued: "sent",
  delivery_delayed: "sent",
  delivered: "delivered",
  opened: "opened",
  clicked: "clicked",
  bounced: "bounced",
  complained: "bounced",
  canceled: "failed",
};

export class ResendEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const fromName = process.env.RESEND_FROM_NAME ?? "KOV";
    if (!apiKey || !fromEmail) {
      throw new Error("Email non envoyé : RESEND_API_KEY ou RESEND_FROM_EMAIL manquant.");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        // Resend attend un tableau, et un nom de destinataire ne se met pas
        // dans un champ à part : il s'écrit dans l'adresse elle-même.
        to: [input.toName ? `${input.toName} <${input.to}>` : input.to],
        subject: input.subject,
        html: input.html,
        // L'adresse de réponse, quand elle diffère de l'expéditeur.
        //
        // Elle compte : l'expéditeur peut être une adresse technique d'un
        // domaine d'envoi, alors qu'un client qui répond doit atteindre une
        // boîte réellement relevée. Sans elle, une réponse se perd — et le
        // client, lui, croit avoir répondu.
        ...(process.env.RESEND_REPLY_TO ? { reply_to: process.env.RESEND_REPLY_TO } : {}),
        ...(input.text ? { text: input.text } : {}),
        ...(input.attachments && input.attachments.length > 0
          ? {
              // `filename` chez Resend, `name` chez Brevo : c'est la seule
              // divergence de forme entre les deux, et elle est ici.
              attachments: input.attachments.map((attachment) => ({
                filename: attachment.name,
                content: attachment.content,
                ...(attachment.contentType ? { content_type: attachment.contentType } : {}),
              })),
            }
          : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      // Le corps d'erreur de Resend nomme la cause (domaine non vérifié,
      // destinataire refusé, quota). Le perdre obligerait à ouvrir leur
      // tableau de bord pour savoir pourquoi un email n'est pas parti.
      throw new Error(`Resend a refusé l'envoi (${response.status}) : ${body.slice(0, 300)}`);
    }

    const result = (await response.json().catch(() => null)) as { id?: string } | null;
    return { providerMessageId: typeof result?.id === "string" ? result.id : null };
  }

  async getStatus(providerMessageId: string): Promise<ProviderMessageStatus> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !providerMessageId) return "unknown";

    const response = await fetch(`${RESEND_API_URL}/${providerMessageId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) return "unknown";

    const result = (await response.json().catch(() => null)) as { last_event?: string } | null;
    const event = result?.last_event;
    return event ? (EVENT_MAP[event] ?? "unknown") : "unknown";
  }
}

export function getEmailProvider(): EmailProvider {
  return new ResendEmailProvider();
}

/** Resend est-il configuré sur cet environnement ? */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}
