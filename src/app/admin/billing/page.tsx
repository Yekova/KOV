import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { INVOICE_STATUSES, INVOICE_STATUS_LABELS, isInvoiceOverdue } from "@/lib/portal/status";
import { InvoiceStatusSelect } from "@/components/admin/invoices/InvoiceStatusSelect";
import { InvoiceRowActions } from "@/components/admin/invoices/InvoiceRowActions";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "Facturation — Admin KOV",
};

const PAGE_SIZE = 25;

function buildQueryString(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

export default async function AdminBillingPage(props: PageProps<"/admin/billing">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const statusFilter = typeof searchParams.status === "string" && searchParams.status ? searchParams.status : "";
  const page = Math.max(1, parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin.from("invoices").select("*", { count: "exact" });
  if (statusFilter && (INVOICE_STATUSES as readonly string[]).includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }
  if (q) {
    const safeQ = q.replace(/[,()%]/g, "");
    query = query.ilike("reference", `%${safeQ}%`);
  }

  const { data: invoices, count } = await query.order("issued_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
  const rows = invoices ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const clientIds = Array.from(new Set(rows.map((i) => i.client_id)));
  const { data: clients } = clientIds.length
    ? await supabaseAdmin.from("profiles").select("id, full_name, email, company").in("id", clientIds)
    : { data: [] };
  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.full_name || c.company || c.email]));

  // Outstanding total: unpaid invoices across ALL clients, not just this
  // page — a separate lightweight query rather than summing the page's rows.
  const { data: outstandingRows } = await supabaseAdmin
    .from("invoices")
    .select("amount_cents")
    .in("status", ["sent", "overdue"]);
  const outstandingCents = (outstandingRows ?? []).reduce((sum, r) => sum + r.amount_cents, 0);

  const baseParams = { q: q || undefined, status: statusFilter || undefined };

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Facturation</h1>
        <div className="text-right">
          <p className="text-kov-steel text-xs uppercase tracking-widest">Impayé (envoyé + en retard)</p>
          <p className="text-kov-red text-xl font-display">{(outstandingCents / 100).toFixed(2)} €</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <form method="GET" className="flex items-center gap-3">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher une référence…"
            className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </form>
        <div className="flex items-center gap-2">
          <Link
            href={buildQueryString({ q: q || undefined })}
            className="px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors"
            style={{
              borderColor: !statusFilter ? "var(--kov-red)" : "var(--kov-border)",
              color: !statusFilter ? "var(--kov-red)" : "var(--kov-bone)",
              borderRadius: "var(--radius-pill)",
            }}
          >
            Tous
          </Link>
          {INVOICE_STATUSES.map((s) => (
            <Link
              key={s}
              href={buildQueryString({ q: q || undefined, status: s })}
              className="px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors"
              style={{
                borderColor: statusFilter === s ? "var(--kov-red)" : "var(--kov-border)",
                color: statusFilter === s ? "var(--kov-red)" : "var(--kov-bone)",
                borderRadius: "var(--radius-pill)",
              }}
            >
              {INVOICE_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState message={q || statusFilter ? "Aucune facture ne correspond à ces critères." : "Aucune facture pour l'instant."} />
      ) : (
        <div className="space-y-2">
          {rows.map((invoice) => {
            const kindLabel =
              invoice.kind === "deposit"
                ? `Acompte${invoice.deposit_percent ? ` ${invoice.deposit_percent}%` : ""}`
                : invoice.kind === "balance"
                  ? "Solde"
                  : null;
            return (
              <div
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-4 border-b py-3"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <div className="min-w-0">
                  <Link href={`/admin/clients/${invoice.client_id}`} className="text-kov-bone text-sm hover:text-kov-red transition-colors">
                    {invoice.reference}
                  </Link>
                  {kindLabel && <span className="text-kov-steel text-xs ml-2 uppercase tracking-widest">{kindLabel}</span>}
                  {isInvoiceOverdue(invoice.status, invoice.due_at) && (
                    <span
                      className="text-[10px] uppercase tracking-widest text-kov-red px-2 py-0.5 ml-2"
                      style={{ background: "rgba(220,38,38,0.1)", borderRadius: "var(--radius-sm)" }}
                    >
                      En retard
                    </span>
                  )}
                  <p className="text-kov-steel text-xs mt-1">{clientNameById.get(invoice.client_id) ?? "—"}</p>
                </div>
                <span className="text-kov-steel text-sm">{(invoice.amount_cents / 100).toFixed(2)} €</span>
                <InvoiceStatusSelect invoiceId={invoice.id} status={invoice.status} />
                <InvoiceRowActions
                  invoiceId={invoice.id}
                  hasPdf={Boolean(invoice.pdf_storage_path)}
                  status={invoice.status}
                  reference={invoice.reference}
                />
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-kov-steel">
          <span>
            Page {page} / {totalPages} — {count} facture{(count ?? 0) > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-4">
            {page > 1 && (
              <Link href={buildQueryString({ ...baseParams, page: String(page - 1) })} className="hover:text-kov-red transition-colors">
                ← Précédent
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildQueryString({ ...baseParams, page: String(page + 1) })} className="hover:text-kov-red transition-colors">
                Suivant →
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
