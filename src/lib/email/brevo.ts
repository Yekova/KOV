import "server-only";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendEmailAttachment {
  name: string;
  content: string; // base64
}

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  attachments?: SendEmailAttachment[];
}

// Direct REST call — Brevo's transactional email API is a single JSON POST,
// not worth a whole SDK dependency for this codebase's one use case.
export async function sendEmail({ to, toName, subject, html, attachments }: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "KOV";
  if (!apiKey || !senderEmail) {
    throw new Error("Email non envoyé : BREVO_API_KEY ou BREVO_SENDER_EMAIL manquant.");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
      ...(attachments && attachments.length > 0 ? { attachment: attachments } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Échec de l'envoi de l'email (Brevo ${response.status}): ${body}`);
  }

  return response.json();
}
