import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getMonthlyRevenueKpi } from "@/lib/admin/kpis";
import { isInvoiceOverdue, INVOICE_STATUSES, INVOICE_STATUS_LABELS, isInvoiceStatus, type InvoiceStatus } from "@/lib/portal/status";
import { InvoiceStatusSelect } from "@/components/admin/invoices/InvoiceStatusSelect";
import { InvoiceRowActions } from "@/components/admin/invoices/InvoiceRowActions";
import { NewInvoiceModal } from "./NewInvoiceModal";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "Facturation — Admin KOV",
};

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

// Same duality as quotes' isQuoteExpired: 'overdue' is a real, manually-set
// status, but a 'sent' invoice quietly past its due_at is *actually*
// overdue too (isInvoiceOverdue), so the "En retard" tab folds both in
// rather than requiring someone to flip the status by hand first.
const TABS: { key: InvoiceStatus; label: string }[] = INVOICE_STATUSES.map((key) => ({ key, label: INVOICE_STATUS_LABELS[key] }));

function matchesTab(invoice: { status: string; due_at: string | null }, tab: InvoiceStatus): boolean {
  if (tab === "overdue") return invoice.status === "overdue" || (invoice.status === "sent" && isInvoiceOverdue(invoice.status, invoice.due_at));
  if (tab === "sent") return invoice.status === "sent" && !isInvoiceOverdue(invoice.status, invoice.due_at);
  return invoice.status === tab;
}

export default async function AdminBillingPage(props: PageProps<"/admin/billing">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";
  const tabParam = typeof searchParams.status === "string" ? searchParams.status : "";
  const activeTab: InvoiceStatus = isInvoiceStatus(tabParam) ? tabParam : "sent";

  const [{ data: invoices }, { data: clients }, monthlyRevenue] = await Promise.all([
    supabaseAdmin.from("invoices").select("*").order("issued_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("id, full_name, email, company").eq("role", "client").order("full_name"),
    getMonthlyRevenueKpi(),
  ]);

  const allInvoices = invoices ?? [];
  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.full_name || c.company || c.email]));
  const clientOptions = (clients ?? []).map((c) => ({ id: c.id, label: c.full_name || c.company || c.email }));

  // KPIs — computed from real data only, no fabricated deltas.
  const invoicedTotal = allInvoices.filter((inv) => inv.status !== "draft" && inv.status !== "cancelled").reduce((sum, inv) => sum + inv.amount_cents, 0);
  const paidCents = allInvoices.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + inv.amount_cents, 0);
  const paidCount = allInvoices.filter((inv) => inv.status === "paid").length;
  const pendingInvoices = allInvoices.filter((inv) => matchesTab(inv, "sent"));
  const pendingCents = pendingInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0);
  const overdueInvoices = allInvoices.filter((inv) => matchesTab(inv, "overdue"));
  const overdueCents = overdueInvoices.reduce((sum, inv) => sum + inv.amount_cents, 0);
  const collectionRate = invoicedTotal > 0 ? Math.round((paidCents / invoicedTotal) * 100) : 0;

  const tabCounts = new Map(TABS.map(({ key }) => [key, allInvoices.filter((inv) => matchesTab(inv, key)).length]));

  const tabInvoices = allInvoices.filter((inv) => matchesTab(inv, activeTab));
  const rows = q ? tabInvoices.filter((inv) => inv.reference.toLowerCase().includes(q)) : tabInvoices;

  function tabHref(tab: InvoiceStatus) {
    const params = new URLSearchParams();
    params.set("status", tab);
    if (q) params.set("q", q);
    return `?${params.toString()}`;
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Facturation</h1>
          <p className="text-kov-steel text-sm mt-1">Suivi de vos factures et paiements.</p>
        </div>
        <NewInvoiceModal clients={clientOptions} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Chiffre d'affaires"
          value={formatEuros(monthlyRevenue.value)}
          evolutionPercent={monthlyRevenue.evolutionPercent}
          isNew={monthlyRevenue.isNew}
          evolutionCaption="vs mois dernier"
          sparkline={monthlyRevenue.sparkline}
        />
        <StatCard label="Factures payées" value={formatEuros(paidCents)} caption={`${paidCount} facture${paidCount > 1 ? "s" : ""}`} />
        <StatCard label="En attente de paiement" value={formatEuros(pendingCents)} caption={`${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""}`} />
        <StatCard label="En retard" value={formatEuros(overdueCents)} caption={`${overdueInvoices.length} facture${overdueInvoices.length > 1 ? "s" : ""}`} />
        <StatCard label="Taux d'encaissement" value={`${collectionRate}%`} caption="Sur les factures émises" />
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
            {INVOICE_STATUS_LABELS[activeTab]} — {rows.length} facture{rows.length > 1 ? "s" : ""}
          </p>
          <form method="GET">
            <input type="hidden" name="status" value={activeTab} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Rechercher une référence…"
              className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            />
          </form>
        </div>

        {rows.length === 0 ? (
          <EmptyState message={q ? "Aucune facture ne correspond à cette recherche." : "Aucune facture dans cette catégorie."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                  <th className="py-3 pr-4">Référence</th>
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Montant</th>
                  <th className="py-3 pr-4">Émise le</th>
                  <th className="py-3 pr-4">Échéance</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((invoice) => {
                  const kindLabel =
                    invoice.kind === "deposit"
                      ? `Acompte${invoice.deposit_percent ? ` ${invoice.deposit_percent}%` : ""}`
                      : invoice.kind === "balance"
                        ? "Solde"
                        : null;
                  const overdue = isInvoiceOverdue(invoice.status, invoice.due_at);
                  return (
                    <tr key={invoice.id} className="border-b align-top" style={{ borderColor: "var(--kov-border)" }}>
                      <td className="py-4 pr-4">
                        <Link href={`/admin/clients/${invoice.client_id}`} className="text-kov-bone hover:text-kov-red transition-colors">
                          {invoice.reference}
                        </Link>
                        {kindLabel && <span className="text-kov-steel text-xs ml-2 uppercase tracking-widest">{kindLabel}</span>}
                        {overdue && (
                          <span
                            className="inline-block text-[10px] uppercase tracking-widest text-kov-red px-2 py-0.5 mt-1 ml-2"
                            style={{ background: "rgba(220,38,38,0.1)", borderRadius: "var(--radius-sm)" }}
                          >
                            En retard
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-kov-steel">{clientNameById.get(invoice.client_id) ?? "—"}</td>
                      <td className="py-4 pr-4 text-kov-bone whitespace-nowrap">{(invoice.amount_cents / 100).toFixed(2)} €</td>
                      <td className="py-4 pr-4 text-kov-steel whitespace-nowrap">
                        {new Date(invoice.issued_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-4 pr-4 text-kov-steel whitespace-nowrap">
                        {invoice.due_at ? new Date(invoice.due_at).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="py-4 pr-4">
                        <InvoiceStatusSelect invoiceId={invoice.id} status={invoice.status} />
                      </td>
                      <td className="py-4 pr-4 min-w-[220px]">
                        <InvoiceRowActions
                          invoiceId={invoice.id}
                          hasPdf={Boolean(invoice.pdf_storage_path)}
                          status={invoice.status}
                          reference={invoice.reference}
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
