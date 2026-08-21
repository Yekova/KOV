import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/portal/status";
import { fromDbLineItems } from "@/lib/billing/quoteLineItems";
import { QuoteRowActions } from "./QuoteRowActions";

export const metadata: Metadata = {
  title: "Devis — KOV",
};

export default async function ClientQuotesPage() {
  const user = await requireUser();

  const { data: quotes } = await supabaseAdmin
    .from("quotes")
    .select("id, reference, line_items, total_cents, status, valid_until, created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const rows = quotes ?? [];

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Devis</h1>

      <GlassCard className="p-6">
        {rows.length === 0 ? (
          <p className="text-kov-steel text-sm">Aucun devis pour l&apos;instant.</p>
        ) : (
          <ul>
            {rows.map((quote) => {
              const items = fromDbLineItems(quote.line_items);
              return (
                <li
                  key={quote.id}
                  className="flex flex-wrap items-center justify-between gap-4 py-4 border-b last:border-b-0"
                  style={{ borderColor: "var(--kov-border)" }}
                >
                  <div className="min-w-0">
                    <p className="text-kov-bone text-sm">{quote.reference}</p>
                    <p className="text-kov-steel text-xs mt-1">
                      {items.length} prestation{items.length > 1 ? "s" : ""}
                      {quote.valid_until && ` — valable jusqu'au ${new Date(quote.valid_until).toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-kov-bone text-sm">{(quote.total_cents / 100).toFixed(2)} €</span>
                    <span className="text-kov-steel text-xs uppercase tracking-widest">
                      {QUOTE_STATUS_LABELS[quote.status as QuoteStatus] ?? quote.status}
                    </span>
                    <QuoteRowActions quoteId={quote.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </main>
  );
}
