import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fromDbLineItems } from "@/lib/billing/quoteLineItems";
import { isQuoteExpired, isQuoteStatus, QUOTE_STATUSES, QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/portal/status";
import { QuoteStatusSelect } from "./QuoteStatusSelect";
import { QuoteRowActions } from "./QuoteRowActions";
import { NewQuoteModal } from "./NewQuoteModal";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "Devis — Admin KOV",
};

// "En cours" in the everyday sense (still draft, not yet sent) vs "Envoyés"
// (already sent, awaiting the client) are kept as separate tabs rather than
// one combined bucket — they call for different actions from the admin.
// "Expirés" folds in both the manually-set 'expired' status AND any 'sent'
// quote whose valid_until has quietly passed (the same isQuoteExpired check
// already used for the red "Expiré" badge), so a quote never sits
// unaccounted-for just because nobody flipped its status by hand.
const TABS: { key: QuoteStatus; label: string }[] = QUOTE_STATUSES.map((key) => ({ key, label: QUOTE_STATUS_LABELS[key] }));

function matchesTab(quote: { status: string; valid_until: string | null }, tab: QuoteStatus): boolean {
  if (tab === "expired") return quote.status === "expired" || (quote.status === "sent" && isQuoteExpired(quote.status, quote.valid_until));
  if (tab === "sent") return quote.status === "sent" && !isQuoteExpired(quote.status, quote.valid_until);
  return quote.status === tab;
}

function daysUntil(dateIso: string): number {
  return Math.ceil((new Date(dateIso).getTime() - Date.now()) / 86_400_000);
}

export default async function AdminQuotesPage(props: PageProps<"/admin/quotes">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const tabParam = typeof searchParams.status === "string" ? searchParams.status : "";
  const activeTab: QuoteStatus = isQuoteStatus(tabParam) ? tabParam : "sent";

  const [{ data: quotes }, { data: clients }, { data: leads }] = await Promise.all([
    supabaseAdmin.from("quotes").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, full_name, email, company").eq("role", "client").order("full_name"),
    supabaseAdmin.from("leads").select("id, name, email, company").order("created_at", { ascending: false }),
  ]);

  const allQuotes = quotes ?? [];
  const clientOptions = (clients ?? []).map((c) => ({ id: c.id, label: `${c.full_name || c.company || c.email}` }));
  const leadOptions = (leads ?? []).map((l) => ({ id: l.id, label: `${l.name}${l.company ? ` (${l.company})` : ""}`, email: l.email }));

  // KPIs — computed from real data only, no fabricated deltas.
  const activeQuotes = allQuotes.filter((quo) => quo.status === "draft" || quo.status === "sent");
  const totalActiveCents = activeQuotes.reduce((sum, quo) => sum + quo.total_cents, 0);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const activeThisMonth = activeQuotes.filter((quo) => new Date(quo.created_at) >= startOfMonth).length;
  const expiringSoon = allQuotes.filter(
    (quo) => quo.status === "sent" && quo.valid_until && daysUntil(quo.valid_until) >= 0 && daysUntil(quo.valid_until) <= 7
  ).length;
  const resolved = allQuotes.filter((quo) => matchesTab(quo, "accepted") || matchesTab(quo, "declined") || matchesTab(quo, "expired") || matchesTab(quo, "cancelled"));
  const acceptedCount = allQuotes.filter((quo) => quo.status === "accepted").length;
  const conversionRate = resolved.length > 0 ? Math.round((acceptedCount / resolved.length) * 100) : 0;

  const tabCounts = new Map(TABS.map(({ key }) => [key, allQuotes.filter((quo) => matchesTab(quo, key)).length]));

  const tabQuotes = allQuotes.filter((quo) => matchesTab(quo, activeTab));
  const rows = q
    ? tabQuotes.filter(
        (quo) =>
          quo.reference.toLowerCase().includes(q) ||
          quo.recipient_name.toLowerCase().includes(q) ||
          quo.recipient_email?.toLowerCase().includes(q)
      )
    : tabQuotes;

  function tabHref(tab: QuoteStatus) {
    const params = new URLSearchParams();
    params.set("status", tab);
    if (q) params.set("q", q);
    return `?${params.toString()}`;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Devis</h1>
          <p className="text-kov-steel text-sm mt-1">Suivi et gestion de tous vos devis.</p>
        </div>
        <NewQuoteModal clients={clientOptions} leads={leadOptions} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Montant total" value={`${(totalActiveCents / 100).toLocaleString("fr-FR")} €`} caption="Devis en cours" />
        <StatCard label="Devis en cours" value={String(activeQuotes.length)} caption={`+${activeThisMonth} ce mois`} />
        <StatCard label="Expiration proche" value={String(expiringSoon)} caption="Dans les 7 prochains jours" />
        <StatCard label="Taux de conversion" value={`${conversionRate}%`} caption="Sur les devis résolus" />
      </div>

      <div>
        <div className="flex items-center gap-2 border-b overflow-x-auto" style={{ borderColor: "var(--kov-border)" }}>
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={tabHref(tab.key)}
                className="flex items-center gap-2 px-3 pb-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors"
                style={{
                  color: isActive ? "var(--kov-red)" : "var(--kov-steel)",
                  borderBottom: isActive ? "2px solid var(--kov-red)" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {tab.label}
                <span
                  className="px-1.5 py-0.5 text-[10px]"
                  style={{
                    background: isActive ? "var(--kov-red)" : "var(--kov-graphite)",
                    color: isActive ? "var(--kov-white)" : "var(--kov-steel)",
                    borderRadius: "var(--radius-pill)",
                  }}
                >
                  {tabCounts.get(tab.key) ?? 0}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 mt-4 mb-4">
          <p className="text-kov-steel text-xs uppercase tracking-widest">
            {QUOTE_STATUS_LABELS[activeTab]} — {rows.length} devis
          </p>
          <form method="GET">
            <input type="hidden" name="status" value={activeTab} />
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

        {rows.length === 0 ? (
          <EmptyState message={q ? "Aucun devis ne correspond à cette recherche." : "Aucun devis dans cette catégorie."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                  <th className="py-3 pr-4">Référence</th>
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Description</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3 pr-4">Créé le</th>
                  <th className="py-3 pr-4">Expiration</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((quote) => {
                  const items = fromDbLineItems(quote.line_items);
                  const expired = isQuoteExpired(quote.status, quote.valid_until);
                  const daysLeft = quote.valid_until ? daysUntil(quote.valid_until) : null;
                  return (
                    <tr key={quote.id} className="border-b align-top" style={{ borderColor: "var(--kov-border)" }}>
                      <td className="py-4 pr-4">
                        <p className="text-kov-bone">{quote.reference}</p>
                        {expired && (
                          <span
                            className="inline-block text-[10px] uppercase tracking-widest text-kov-red px-2 py-0.5 mt-1"
                            style={{ background: "rgba(220,38,38,0.1)", borderRadius: "var(--radius-sm)" }}
                          >
                            Expiré
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-kov-steel">
                        <p>{quote.recipient_name}</p>
                        {quote.recipient_email && <p className="text-xs mt-0.5">{quote.recipient_email}</p>}
                      </td>
                      <td className="py-4 pr-4 text-kov-steel max-w-xs">
                        {items.length} ligne{items.length > 1 ? "s" : ""} — {items.map((i) => i.description).join(", ")}
                      </td>
                      <td className="py-4 pr-4 text-kov-bone whitespace-nowrap">{(quote.total_cents / 100).toFixed(2)} €</td>
                      <td className="py-4 pr-4 text-kov-steel whitespace-nowrap">
                        {new Date(quote.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4 pr-4 whitespace-nowrap">
                        {quote.valid_until ? (
                          <>
                            <span className="text-kov-steel">{new Date(quote.valid_until).toLocaleDateString("fr-FR")}</span>
                            {daysLeft !== null && quote.status === "sent" && (
                              <p className="text-xs mt-0.5" style={{ color: daysLeft < 0 ? "var(--kov-red)" : daysLeft <= 7 ? "var(--kov-red-signal)" : "var(--kov-steel)" }}>
                                {daysLeft < 0 ? "Expiré" : daysLeft === 0 ? "Aujourd'hui" : `Dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-kov-steel">—</span>
                        )}
                      </td>
                      <td className="py-4 pr-4">
                        <QuoteStatusSelect quoteId={quote.id} status={quote.status} />
                      </td>
                      <td className="py-4 pr-4 min-w-[260px]">
                        <QuoteRowActions
                          quoteId={quote.id}
                          hasEmail={Boolean(quote.recipient_email)}
                          status={quote.status}
                          reference={quote.reference}
                          clientId={quote.client_id}
                          totalCents={quote.total_cents}
                          invoiceId={quote.invoice_id}
                          clients={clientOptions}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
