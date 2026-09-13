import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { refreshAccessToken, sendMailAsConnectedUser } from "@/lib/auth/microsoftGraph";
import type { EmailProvider, SendEmailInput, SendEmailResult, ProviderMessageStatus } from "@/lib/email/provider";

// Delegated send via Microsoft Graph — the email genuinely leaves the
// connected admin's own Outlook/Microsoft 365 mailbox (lands in their Sent
// folder, replies come back to their real inbox), not a shared transactional
// sender. One instance is bound to one admin's stored refresh token; see
// resolveProvider.ts for how an admin ends up using this instead of Brevo.
export class MicrosoftGraphEmailProvider implements EmailProvider {
  constructor(
    private readonly adminId: string,
    private readonly refreshToken: string
  ) {}

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const tokens = await refreshAccessToken(this.refreshToken);
    // Microsoft rotates refresh tokens on every use — persist the new one
    // immediately, or the *next* send silently starts failing once the old
    // one is invalidated.
    if (tokens.refresh_token && tokens.refresh_token !== this.refreshToken) {
      await supabaseAdmin.from("profiles").update({ ms_refresh_token: tokens.refresh_token }).eq("id", this.adminId);
    }

    await sendMailAsConnectedUser(tokens.access_token, {
      to: input.to,
      toName: input.toName,
      subject: input.subject,
      html: input.html,
      attachments: input.attachments,
    });

    // Graph's /sendMail is fire-and-forget by design — it doesn't return a
    // message id synchronously (unlike /messages + /send, a heavier two-step
    // call this doesn't need for a one-shot transactional email).
    return { providerMessageId: null };
  }

  // Same reasoning as BrevoEmailProvider's own stub — no webhook/polling
  // ingestion of Graph delivery status exists yet.
  async getStatus(): Promise<ProviderMessageStatus> {
    return "unknown";
  }
}
