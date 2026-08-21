import { emailLayout } from "./emailLayout";
import { formatEuros, formatDate } from "@/lib/billing/pdfStyles";

export interface QuoteExpiringEmailData {
  recipientName: string;
  reference: string;
  totalCents: number;
  validUntil: string;
}

export function quoteExpiringEmailSubject(data: QuoteExpiringEmailData) {
  return `Votre devis ${data.reference} expire bientôt — KOV`;
}

export async function quoteExpiringEmailHtml(data: QuoteExpiringEmailData) {
  const firstName = data.recipientName.split(" ")[0] || data.recipientName;
  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">Bonjour ${firstName},</p>
    <p style="margin:0 0 24px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Petit rappel amical : votre devis <strong>${data.reference}</strong> (${formatEuros(data.totalCents)}) est valable jusqu'au <strong>${formatDate(data.validUntil)}</strong>. Vous le trouverez de nouveau ci-joint.
    </p>
    <p style="margin:0 0 8px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Une question, un ajustement à faire ? Répondez directement à cet email.
    </p>
    <p style="margin:24px 0 0; color:#0a0a0a; font-size:15px; line-height:1.6;">
      À bientôt,<br />
      L'équipe KOV
    </p>
  `;
  return emailLayout({ preheader: `Votre devis ${data.reference} expire le ${formatDate(data.validUntil)}`, body });
}

export interface InvoiceOverdueEmailData {
  clientName: string;
  reference: string;
  amountCents: number;
  dueAt: string;
}

export function invoiceOverdueEmailSubject(data: InvoiceOverdueEmailData) {
  return `Facture ${data.reference} en retard de paiement — KOV`;
}

export async function invoiceOverdueEmailHtml(data: InvoiceOverdueEmailData) {
  const firstName = data.clientName.split(" ")[0] || data.clientName;
  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">Bonjour ${firstName},</p>
    <p style="margin:0 0 24px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Notre facture <strong>${data.reference}</strong> (${formatEuros(data.amountCents)}), dont l'échéance était fixée au ${formatDate(data.dueAt)}, semble ne pas encore avoir été réglée. Vous la trouverez de nouveau ci-joint.
    </p>
    <p style="margin:0 0 8px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Si le règlement a déjà été effectué, merci d'ignorer cet email. Pour toute question, il vous suffit de répondre directement ici.
    </p>
    <p style="margin:24px 0 0; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Merci,<br />
      L'équipe KOV
    </p>
  `;
  return emailLayout({ preheader: `Facture ${data.reference} — ${formatEuros(data.amountCents)} en retard`, body });
}

export interface RequestReplyNotificationData {
  clientDisplayName: string;
  subject: string;
  clientId: string;
}

export function requestReplyNotificationSubject(data: RequestReplyNotificationData) {
  return `${data.clientDisplayName} a répondu — « ${data.subject} »`;
}

export async function requestReplyNotificationHtml(data: RequestReplyNotificationData) {
  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      <strong>${data.clientDisplayName}</strong> a répondu dans la demande « ${data.subject} ».
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="background-color:#e31e24; border-radius:6px;">
          <a href="https://kov-agency.site/admin/clients/${data.clientId}" style="display:inline-block; padding:14px 28px; color:#ffffff; font-size:14px; text-decoration:none; font-weight:bold;">
            Voir la conversation →
          </a>
        </td>
      </tr>
    </table>
  `;
  return emailLayout({ preheader: `${data.clientDisplayName} a répondu — ${data.subject}`, body });
}
