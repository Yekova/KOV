import "server-only";

export interface EmailAttachment {
  name: string;
  content: string; // base64
  contentType?: string;
}

export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  /** Déduplique un envoi rejoué. Honoré par Resend (24 h), ignoré par les
   *  autres fournisseurs, qui n'ont rien d'équivalent. Indispensable aux
   *  relances : un cron relancé ne doit pas écrire deux fois au client. */
  idempotencyKey?: string;
}

export interface SendEmailResult {
  providerMessageId: string | null;
}

export type ProviderMessageStatus = "unknown" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed";

// Interchangeable transactional-email provider — sendLeadEmail() only ever
// talks to this interface, never to Brevo (or whichever provider is
// configured) directly. handleWebhook() is intentionally a stub for now:
// webhook ingestion (delivered/opened/clicked/bounced events → email_events)
// is scoped to the next pass, this just keeps the interface complete so
// swapping providers later doesn't mean redesigning the contract.
export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
  getStatus(providerMessageId: string): Promise<ProviderMessageStatus>;
}
