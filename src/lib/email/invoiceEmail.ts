import { emailLayout } from "./emailLayout";
import { formatEuros, formatDate } from "@/lib/billing/pdfStyles";

const KIND_LABEL = {
  full: "votre facture",
  deposit: "votre facture d'acompte",
  balance: "votre facture de solde",
} as const;

export interface InvoiceEmailData {
  clientName: string;
  reference: string;
  kind: "full" | "deposit" | "balance";
  amountCents: number;
  dueAt: string | null;
  projectName: string | null;
}

export function invoiceEmailSubject(data: InvoiceEmailData) {
  const kindWord = data.kind === "deposit" ? "Acompte" : data.kind === "balance" ? "Solde" : "Facture";
  return `${kindWord} ${data.reference} — KOV${data.projectName ? ` · ${data.projectName}` : ""}`;
}

export async function invoiceEmailHtml(data: InvoiceEmailData) {
  const firstName = data.clientName.split(" ")[0] || data.clientName;

  const body = `
    <p style="margin:0 0 16px; color:#0a0a0a; font-size:15px; line-height:1.6;">Bonjour ${firstName},</p>
    <p style="margin:0 0 24px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Vous trouverez ci-joint ${KIND_LABEL[data.kind]}${data.projectName ? ` pour le projet <strong>${data.projectName}</strong>` : ""}.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f3f1; border-radius:6px; margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="color:#777774; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:4px;">Référence</td>
              <td style="color:#777774; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:4px; text-align:right;">Montant</td>
            </tr>
            <tr>
              <td style="color:#0a0a0a; font-size:16px; font-weight:bold;">${data.reference}</td>
              <td style="color:#e31e24; font-size:20px; font-weight:bold; text-align:right;">${formatEuros(data.amountCents)}</td>
            </tr>
            ${
              data.dueAt
                ? `<tr><td colspan="2" style="padding-top:12px; color:#777774; font-size:13px;">Échéance : ${formatDate(data.dueAt)}</td></tr>`
                : ""
            }
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Pour toute question sur cette facture, il vous suffit de répondre directement à cet email.
    </p>
    <p style="margin:24px 0 0; color:#0a0a0a; font-size:15px; line-height:1.6;">
      Merci pour votre confiance,<br />
      L'équipe KOV
    </p>
  `;

  return emailLayout({ preheader: `${KIND_LABEL[data.kind]} ${data.reference} — ${formatEuros(data.amountCents)}`, body });
}
