import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getEmailProvider as getBrevoProvider } from "@/lib/email/providers/brevoProvider";
import { getEmailProvider as getResendProvider, isResendConfigured } from "@/lib/email/providers/resendProvider";
import { MicrosoftGraphEmailProvider } from "@/lib/email/providers/microsoftGraphProvider";
import type { EmailProvider, SendEmailInput, SendEmailResult, ProviderMessageStatus } from "@/lib/email/provider";
import { applySafeMode, isSafeModeEnabled } from "@/lib/email/safeMode";

// Le mode sûr est appliqué ICI, sur le fournisseur, et nulle part ailleurs.
//
// Le poser dans chaque appelant reviendrait à espérer que personne n'oublie —
// et il suffit d'un oubli pour écrire à un vrai client depuis une machine de
// développement. Enveloppé autour du fournisseur, aucun chemin d'envoi ne
// peut le contourner : ni les invitations, ni les relances, ni le cron, ni
// un futur bouton qu'on n'a pas encore écrit.
class SafeModeEmailProvider implements EmailProvider {
  constructor(private readonly inner: EmailProvider) {}

  send(input: SendEmailInput): Promise<SendEmailResult> {
    return this.inner.send(applySafeMode(input));
  }

  getStatus(providerMessageId: string): Promise<ProviderMessageStatus> {
    return this.inner.getStatus(providerMessageId);
  }
}

function guarded(provider: EmailProvider): EmailProvider {
  return isSafeModeEnabled() ? new SafeModeEmailProvider(provider) : provider;
}

// L'expéditeur partagé : Resend dès que sa clé est configurée, Brevo sinon.
//
// Pas de variable de choix supplémentaire. La présence de la clé EST le
// choix, et le retour arrière est donc « retirer RESEND_API_KEY » — une
// seule chose à faire, sans se demander quelle valeur remettre dans quel
// drapeau. Brevo reste câblé et fonctionnel tant que personne ne le retire.
export function getSharedEmailProvider(): EmailProvider {
  return guarded(isResendConfigured() ? getResendProvider() : getBrevoProvider());
}

// Resolves which provider a given admin's outbound email should use: if
// they've connected their own Outlook/365 mailbox (Paramètres → "Connecter
// Outlook"), send delegated as them via Microsoft Graph so it lands in
// their own Sent folder and replies land back in their real inbox;
// otherwise fall back to the shared sender resolved above. `senderId` is
// optional — system/automated emails with no specific human sender (the
// public contact form, the daily-reminders cron, activity notification
// emails) keep using the shared sender by omitting it, since there's no
// personal mailbox for those to plausibly come from.
export async function getEmailProviderForSender(senderId?: string | null): Promise<EmailProvider> {
  if (senderId) {
    const { data } = await supabaseAdmin.from("profiles").select("ms_refresh_token").eq("id", senderId).maybeSingle();
    if (data?.ms_refresh_token) {
      return guarded(new MicrosoftGraphEmailProvider(senderId, data.ms_refresh_token));
    }
  }
  return getSharedEmailProvider();
}
