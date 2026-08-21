import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromDbLineItems } from "@/lib/billing/quoteLineItems";
import { QuoteStatusSelect } from "./QuoteStatusSelect";
import { QuoteRowActions } from "./QuoteRowActions";
import { NewQuoteForm } from "./NewQuoteForm";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "Devis — Admin KOV",
};

const PAGE_SIZE = 20;

function buildQueryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

export default async function AdminQuotesPage(props: PageProps<"/admin/quotes">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const page = Math.max(1, parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let quotesQuery = supabaseAdmin.from("quotes").select("*", { count: "exact" });
  if (q) {
    const safeQ = q.replace(/[,()%]/g, "");
    quotesQuery = quotesQuery.or(`reference.ilike.%${safeQ}%,recipient_name.ilike.%${safeQ}%,recipient_email.ilike.%${safeQ}%`);
  }

  const [{ data: quotes, count }, { data: clients }, { data: leads }] = await Promise.all([
    quotesQuery.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
    supabaseAdmin.from("profiles").select("id, full_name, email, company").eq("role", "client").order("full_name"),
    supabaseAdmin.from("leads").select("id, name, email, company").order("created_at", { ascending: false }),
  ]);

  const rows = quotes ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Devis</h1>
        <form method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un devis…"
            className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </form>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Devis existants</h2>
        {rows.length === 0 ? (
          <div className="mb-8">
            <EmptyState message={q ? "Aucun devis ne correspond à cette recherche." : "Aucun devis pour l'instant."} />
          </div>
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
                  <QuoteRowActions
                    quoteId={quote.id}
                    hasEmail={Boolean(quote.recipient_email)}
                    status={quote.status}
                    reference={quote.reference}
                  />
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-kov-steel">
            <span>
              Page {page} / {totalPages} — {count} devis
            </span>
            <div className="flex items-center gap-4">
              {page > 1 && (
                <Link href={buildQueryString({ q: q || undefined, page: String(page - 1) })} className="hover:text-kov-red transition-colors">
                  ← Précédent
                </Link>
              )}
              {page < totalPages && (
                <Link href={buildQueryString({ q: q || undefined, page: String(page + 1) })} className="hover:text-kov-red transition-colors">
                  Suivant →
                </Link>
              )}
            </div>
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
