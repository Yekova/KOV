import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromDbLineItems } from "@/lib/billing/quoteLineItems";
import { QuoteStatusSelect } from "./QuoteStatusSelect";
import { QuoteRowActions } from "./QuoteRowActions";
import { NewQuoteForm } from "./NewQuoteForm";

export const metadata: Metadata = {
  title: "Devis — Admin KOV",
};

export default async function AdminQuotesPage() {
  await requireAdmin();

  const [{ data: quotes }, { data: clients }, { data: leads }] = await Promise.all([
    supabaseAdmin.from("quotes").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, full_name, email, company").eq("role", "client").order("full_name"),
    supabaseAdmin.from("leads").select("id, name, email, company").order("created_at", { ascending: false }),
  ]);

  const rows = quotes ?? [];
  const clientOptions = (clients ?? []).map((c) => ({
    id: c.id,
    label: `${c.full_name || c.company || c.email}`,
  }));
  const leadOptions = (leads ?? []).map((l) => ({
    id: l.id,
    label: `${l.name}${l.company ? ` (${l.company})` : ""}`,
    email: l.email,
  }));

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto w-full space-y-10">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Devis</h1>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Devis existants</h2>
        {rows.length === 0 ? (
          <p className="text-kov-steel text-sm mb-8">Aucun devis pour l&apos;instant.</p>
        ) : (
          <div className="space-y-2 mb-8">
            {rows.map((quote) => {
              const items = fromDbLineItems(quote.line_items);
              return (
                <div
                  key={quote.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b py-4"
                  style={{ borderColor: "var(--kov-border)" }}
                >
                  <div className="min-w-0">
                    <p className="text-kov-bone text-sm">{quote.reference}</p>
                    <p className="text-kov-steel text-xs mt-1">
                      {quote.recipient_name}
                      {quote.recipient_email ? ` — ${quote.recipient_email}` : ""}
                    </p>
                    <p className="text-kov-steel text-xs mt-1">
                      {items.length} ligne{items.length > 1 ? "s" : ""} — {items.map((i) => i.description).join(", ")}
                    </p>
                  </div>
                  <span className="text-kov-steel text-sm">{(quote.total_cents / 100).toFixed(2)} €</span>
                  <QuoteStatusSelect quoteId={quote.id} status={quote.status} />
                  <QuoteRowActions quoteId={quote.id} hasEmail={Boolean(quote.recipient_email)} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Nouveau devis</h2>
        <NewQuoteForm clients={clientOptions} leads={leadOptions} />
      </section>
    </main>
  );
}
