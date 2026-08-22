import { emailLayout } from "./emailLayout";

// name/company/message all come straight from the public, unauthenticated
// contact form — unlike every other email template in this codebase, whose
// interpolated values are admin- or client-account-controlled. Escaping is
// required here, not just good practice, or a submitted message could
// inject arbitrary HTML into the admin's own inbox.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function leadConfirmationSubject() {
  return "On a bien reçu votre message — KOV";
}

export async function leadConfirmationHtml({ name }: { name: string }) {
  const firstName = escapeHtml(name.split(" ")[0] || name);
  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">Bonjour ${firstName},</p>
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Merci pour votre message — on l'a bien reçu et on revient vers vous rapidement.
    </p>
    <p style="margin:0; color:#0a0a0a; font-size:15px; line-height:1.6;">
      À bientôt,<br />
      L'équipe KOV
    </p>
  `;
  return emailLayout({ preheader: "On a bien reçu votre message — on revient vers vous rapidement.", body });
}

export interface NewLeadNotificationData {
  name: string;
  email: string;
  company: string | null;
  message: string | null;
}

export function newLeadNotificationSubject(data: NewLeadNotificationData) {
  return `Nouveau lead : ${data.name}${data.company ? ` (${data.company})` : ""}`;
}

export async function newLeadNotificationHtml(data: NewLeadNotificationData) {
  const name = escapeHtml(data.name);
  const company = data.company ? escapeHtml(data.company) : null;
  const email = escapeHtml(data.email);
  const message = data.message ? escapeHtml(data.message) : null;

  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      <strong>${name}</strong>${company ? ` — ${company}` : ""} vient de soumettre le formulaire de contact.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f3f1; border-radius:6px; margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 8px; color:#777774; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Email</p>
          <p style="margin:0 0 16px; color:#0a0a0a; font-size:14px;">${email}</p>
          ${
            message
              ? `<p style="margin:0 0 8px; color:#777774; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Message</p><p style="margin:0; color:#0a0a0a; font-size:14px; line-height:1.5;">${message}</p>`
              : ""
          }
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:#e31e24; border-radius:6px;">
          <a href="https://kov-agency.site/admin/leads" style="display:inline-block; padding:14px 28px; color:#ffffff; font-size:14px; text-decoration:none; font-weight:bold;">
            Voir le lead →
          </a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout({ preheader: `Nouveau lead : ${data.name}`, body });
}
