import { emailLayout } from "./emailLayout";
import { formatEuros, formatDate } from "@/lib/billing/pdfStyles";

export interface QuoteEmailData {
  recipientName: string;
  reference: string;
  totalCents: number;
  validUntil: string | null;
}

export function quoteEmailSubject(data: QuoteEmailData) {
  return `Votre devis ${data.reference} — KOV`;
}

export async function quoteEmailHtml(data: QuoteEmailData) {
  const firstName = data.recipientName.split(" ")[0] || data.recipientName;

  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">Bonjour ${firstName},</p>
    <p style="margin:0 0 24px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Merci pour votre projet — vous trouverez ci-joint notre devis détaillé.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f3f1; border-radius:6px; margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#777774; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:4px;">Référence</td>
              <td style="color:#777774; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:4px; text-align:right;">Total</td>
            </tr>
            <tr>
              <td style="color:#0a0a0a; font-size:16px; font-weight:bold;">${data.reference}</td>
              <td style="color:#e31e24; font-size:20px; font-weight:bold; text-align:right;">${formatEuros(data.totalCents)}</td>
            </tr>
            ${
              data.validUntil
                ? `<tr><td colspan="2" style="padding-top:12px; color:#777774; font-size:13px;">Valable jusqu'au ${formatDate(data.validUntil)}</td></tr>`
                : ""
            }
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      N'hésitez pas à répondre directement à cet email pour toute question ou ajustement — on est là pour affiner ça avec vous.
    </p>
    <p style="margin:24px 0 0; color:#0a0a0a; font-size:15px; line-height:1.6;">
      À bientôt,<br />
      L'équipe KOV
    </p>
  `;

  return emailLayout({ preheader: `Votre devis ${data.reference} — ${formatEuros(data.totalCents)}`, body });
}
