import { getBusinessInfo } from "@/lib/billing/businessInfo";

const SITE_URL = "https://kov-agency.site";
// Bone-on-transparent, not the black variant — it sits on the header's dark
// background below. CSS filter:invert() isn't reliable enough across email
// clients (Outlook desktop ignores it outright) to invert the black one instead.
const LOGO_URL = `${SITE_URL}/kov/brand/kov-wordmark-bone.png`;

// Email-safe HTML: inline styles only, no external stylesheet, no flex/grid —
// table-based layout is deliberate here, unlike the rest of this codebase,
// because email clients (Outlook especially) don't reliably support modern
// CSS. Kept light-background for the same reason the PDFs are: a heavy dark
// theme doesn't reproduce reliably across mail clients.
export async function emailLayout({ preheader, body }: { preheader: string; body: string }) {
  const businessInfo = await getBusinessInfo();
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>KOV</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f3f1; font-family:Helvetica,Arial,sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f3f1; padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background-color:#0a0a0a; padding:24px 32px;">
                <img src="${LOGO_URL}" alt="KOV" height="18" style="display:block;" />
              </td>
            </tr>
            <tr>
              <td style="height:3px; background-color:#e31e24; line-height:3px; font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; background-color:#f4f3f1; color:#777774; font-size:11px; line-height:1.6;">
                ${businessInfo.commercialName} — ${businessInfo.legalName}, ${businessInfo.legalForm} — ${businessInfo.address.street}, ${businessInfo.address.postalCode} ${businessInfo.address.city}<br />
                SIRET ${businessInfo.siret} — ${businessInfo.vatMention}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
