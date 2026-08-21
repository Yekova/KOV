import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/portal/status";
import { downloadInvoice } from "./actions";

export const metadata: Metadata = {
  title: "Facturation — KOV",
};

export default async function ClientInvoicesPage() {
  const user = await requireUser();

  const { data: invoices } = await supabaseAdmin
    .from("invoices")
    .select("id, reference, amount_cents, currency, status, pdf_storage_path, issued_at, kind, deposit_percent")
    .eq("client_id", user.id)
    .order("issued_at", { ascending: false });

  const rows = invoices ?? [];

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Facturation</h1>

      <GlassCard className="p-6">
        {rows.length === 0 ? (
          <p className="text-kov-steel text-sm">Aucune facture pour l&apos;instant.</p>
        ) : (
          <ul>
            {rows.map((invoice) => (
              <li
                key={invoice.id}
                className="flex items-center justify-between gap-4 py-4 border-b last:border-b-0"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <div className="min-w-0">
                  <p className="text-kov-bone text-sm">
                    {invoice.reference}
                    {invoice.kind === "deposit" && (
                      <span className="text-kov-steel text-xs ml-2 uppercase tracking-widest">
                        Acompte{invoice.deposit_percent ? ` ${invoice.deposit_percent}%` : ""}
                      </span>
                    )}
                    {invoice.kind === "balance" && <span className="text-kov-steel text-xs ml-2 uppercase tracking-widest">Solde</span>}
                  </p>
                  <p className="text-kov-steel text-xs mt-1">
                    {new Date(invoice.issued_at).toLocaleDateString("fr-FR")} —{" "}
                    {(invoice.amount_cents / 100).toFixed(2)} {invoice.currency}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-kov-steel text-xs uppercase tracking-widest">
                    {INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus] ?? invoice.status}
                  </span>
                  {invoice.pdf_storage_path ? (
                    <form action={downloadInvoice}>
                      <input type="hidden" name="invoice_id" value={invoice.id} />
                      <Button type="submit" variant="ghost">
                        Télécharger →
                      </Button>
                    </form>
                  ) : (
                    <span className="text-kov-steel text-xs">PDF indisponible</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}
