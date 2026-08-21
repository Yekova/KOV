import { emailLayout } from "./emailLayout";

export function adminInviteEmailSubject() {
  return "Invitation à rejoindre l'équipe KOV";
}

export async function adminInviteEmailHtml({ fullName, actionLink }: { fullName: string | null; actionLink: string }) {
  const firstName = fullName?.split(" ")[0];
  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">Bonjour${firstName ? ` ${firstName}` : ""},</p>
    <p style="margin:0 0 24px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Vous avez été invité(e) à rejoindre l'espace admin de KOV. Cliquez ci-dessous pour créer votre mot de passe et accéder au tableau de bord.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#e31e24; border-radius:6px;">
          <a href="${actionLink}" style="display:inline-block; padding:14px 28px; color:#ffffff; font-size:14px; text-decoration:none; font-weight:bold;">
            Créer mon accès →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0; color:#777774; font-size:13px; line-height:1.6;">
      Ce lien est à usage unique et expire après quelques jours. Si vous n'êtes pas à l'origine de cette invitation, ignorez cet email.
    </p>
  `;
  return emailLayout({ preheader: "Vous avez été invité(e) à rejoindre l'équipe KOV", body });
}

export function clientInviteEmailSubject() {
  return "Votre espace client KOV est prêt";
}

export async function clientInviteEmailHtml({ fullName, actionLink }: { fullName: string | null; actionLink: string }) {
  const firstName = fullName?.split(" ")[0];
  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">Bonjour${firstName ? ` ${firstName}` : ""},</p>
    <p style="margin:0 0 24px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Votre espace client KOV est prêt. Cliquez ci-dessous pour créer votre mot de passe et suivre l'avancement de votre projet, vos documents et vos factures au même endroit.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#e31e24; border-radius:6px;">
          <a href="${actionLink}" style="display:inline-block; padding:14px 28px; color:#ffffff; font-size:14px; text-decoration:none; font-weight:bold;">
            Accéder à mon espace →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0; color:#777774; font-size:13px; line-height:1.6;">
      Ce lien est à usage unique et expire après quelques jours. Si vous n'êtes pas à l'origine de cette invitation, ignorez cet email.
    </p>
  `;
  return emailLayout({ preheader: "Votre espace client KOV est prêt", body });
}
