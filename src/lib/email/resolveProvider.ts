import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getEmailProvider as getBrevoProvider } from "@/lib/email/providers/brevoProvider";
import { getEmailProvider as getResendProvider, isResendConfigured } from "@/lib/email/providers/resendProvider";
import { MicrosoftGraphEmailProvider } from "@/lib/email/providers/microsoftGraphProvider";
import type { EmailProvider } from "@/lib/email/provider";

// L'expéditeur partagé : Resend dès que sa clé est configurée, Brevo sinon.
//
// Pas de variable de choix supplémentaire. La présence de la clé EST le
// choix, et le retour arrière est donc « retirer RESEND_API_KEY » — une
// seule chose à faire, sans se demander quelle valeur remettre dans quel
// drapeau. Brevo reste câblé et fonctionnel tant que personne ne le retire.
export function getSharedEmailProvider(): EmailProvider {
  return isResendConfigured() ? getResendProvider() : getBrevoProvider();
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
      return new MicrosoftGraphEmailProvider(senderId, data.ms_refresh_token);
    }
  }
  return getSharedEmailProvider();
}
