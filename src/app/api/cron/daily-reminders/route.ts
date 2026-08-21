import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";
import { sendEmail } from "@/lib/email/brevo";
import {
  quoteExpiringEmailSubject,
  quoteExpiringEmailHtml,
  invoiceOverdueEmailSubject,
  invoiceOverdueEmailHtml,
} from "@/lib/email/reminderEmail";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// Runs once a day (see vercel.json). No "already reminded" tracking column —
// each check targets a ~24h window matching the daily cadence, so a quote/
// invoice naturally falls into the window exactly once. Trade-off: if the
// cron misses a day, that item silently never gets reminded (falls out of
// the window) rather than being reminded late — acceptable for a first
// version, but worth knowing if reminders ever seem to skip an item.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const results = { quotesReminded: 0, invoicesReminded: 0, errors: [] as string[] };

  const { data: quotes } = await supabaseAdmin
    .from("quotes")
    .select("id, reference, recipient_name, recipient_email, total_cents, valid_until")
    .eq("status", "sent")
    .not("recipient_email", "is", null)
    .gte("valid_until", new Date(now + 2 * DAY_MS).toISOString())
    .lt("valid_until", new Date(now + 3 * DAY_MS).toISOString());

  for (const quote of quotes ?? []) {
    try {
      const signedUrl = await createSignedDownloadUrl(`quotes/${quote.id}.pdf`);
      const pdfBuffer = signedUrl ? Buffer.from(await (await fetch(signedUrl)).arrayBuffer()) : null;

      const emailData = {
        recipientName: quote.recipient_name,
        reference: quote.reference,
        totalCents: quote.total_cents,
        validUntil: quote.valid_until as string,
      };
      await sendEmail({
        to: quote.recipient_email as string,
        toName: quote.recipient_name,
        subject: quoteExpiringEmailSubject(emailData),
        html: await quoteExpiringEmailHtml(emailData),
        attachments: pdfBuffer ? [{ name: `${quote.reference}.pdf`, content: pdfBuffer.toString("base64") }] : undefined,
      });
      results.quotesReminded++;
    } catch (err) {
      results.errors.push(`quote ${quote.reference}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("id, client_id, reference, amount_cents, due_at, pdf_storage_path")
    .eq("status", "sent")
    .gte("due_at", new Date(now - DAY_MS).toISOString())
    .lt("due_at", new Date(now).toISOString());

  for (const invoice of invoices ?? []) {
    try {
      const { data: client } = await supabaseAdmin
        .from("profiles")
        .select("full_name, company, email")
        .eq("id", invoice.client_id)
        .maybeSingle();
      if (!client?.email) continue;

      const pdfBuffer = invoice.pdf_storage_path
        ? await (async () => {
            const signedUrl = await createSignedDownloadUrl(invoice.pdf_storage_path as string);
            return signedUrl ? Buffer.from(await (await fetch(signedUrl)).arrayBuffer()) : null;
          })()
        : null;

      const emailData = {
        clientName: client.full_name || client.company || client.email,
        reference: invoice.reference,
        amountCents: invoice.amount_cents,
        dueAt: invoice.due_at as string,
      };
      await sendEmail({
        to: client.email,
        toName: emailData.clientName,
        subject: invoiceOverdueEmailSubject(emailData),
        html: await invoiceOverdueEmailHtml(emailData),
        attachments: pdfBuffer ? [{ name: `${invoice.reference}.pdf`, content: pdfBuffer.toString("base64") }] : undefined,
      });
      results.invoicesReminded++;
    } catch (err) {
      results.errors.push(`invoice ${invoice.reference}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return NextResponse.json(results);
}
