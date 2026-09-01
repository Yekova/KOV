import "server-only";
import { sendEmail as sendViaBrevo } from "@/lib/email/brevo";
import type { EmailProvider, SendEmailInput, SendEmailResult, ProviderMessageStatus } from "@/lib/email/provider";

// Wraps the existing src/lib/email/brevo.ts (already used by invites/quotes/
// invoices — left untouched) behind the EmailProvider interface. Swapping
// providers later means writing a new file like this one, not touching any
// call site.
export class BrevoEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const result = await sendViaBrevo({
      to: input.to,
      toName: input.toName,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments,
    });
    const providerMessageId = typeof result?.messageId === "string" ? result.messageId : null;
    return { providerMessageId };
  }

  // Brevo's delivery/open/click events arrive via webhook, not a
  // synchronous status-check endpoint — this pass doesn't ingest webhooks
  // yet (next pass, per email_events), so there's nothing to poll against.
  // Kept on the interface for completeness rather than left unimplemented.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the EmailProvider interface, unused until webhook ingestion lands
  async getStatus(providerMessageId: string): Promise<ProviderMessageStatus> {
    return "unknown";
  }
}

export function getEmailProvider(): EmailProvider {
  return new BrevoEmailProvider();
}
