import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LeadStatusSelect } from "./LeadStatusSelect";
import { AssignLeadSelect } from "./AssignLeadSelect";
import { CONTACT_METHOD_LABELS, LEAD_TIMELINE_LABELS, isContactMethod, isLeadTimeline } from "@/lib/admin/status";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "Leads — Admin KOV",
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

export default async function AdminLeadsPage(props: PageProps<"/admin/leads">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const page = Math.max(1, parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from("leads")
    .select(
      "id, created_at, name, email, phone, company, project_type, contact_method, timeline, message, status, assigned_to",
      { count: "exact" }
    );

  if (q) {
    const safeQ = q.replace(/[,()%]/g, "");
    query = query.or(`name.ilike.%${safeQ}%,email.ilike.%${safeQ}%,company.ilike.%${safeQ}%`);
  }

  const { data: leads, count } = await query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const rows = leads ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const { data: adminProfiles } = await supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").order("full_name");
  const adminOptions = (adminProfiles ?? []).map((a) => ({ id: a.id, label: a.full_name || a.email }));

  const baseParams = { q: q || undefined };

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Leads</h1>
        <form method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un lead…"
            className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState message={q ? "Aucun lead ne correspond à cette recherche." : "Aucune demande pour l'instant."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Nom</th>
                <th className="py-3 pr-4">Entreprise</th>
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Type de projet</th>
                <th className="py-3 pr-4">Moyen</th>
                <th className="py-3 pr-4">Délai</th>
                <th className="py-3 pr-4">Assigné à</th>
                <th className="py-3 pr-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr key={lead.id} className="border-b align-top" style={{ borderColor: "var(--kov-border)" }}>
                  <td className="py-4 pr-4 text-kov-steel whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-4 pr-4 text-kov-bone">{lead.name}</td>
                  <td className="py-4 pr-4 text-kov-steel">{lead.company || "—"}</td>
                  <td className="py-4 pr-4 text-kov-bone">
                    <a href={`mailto:${lead.email}`} className="hover:text-kov-red transition-colors">
                      {lead.email}
                    </a>
                    {lead.phone && <div className="text-kov-steel text-xs mt-1">{lead.phone}</div>}
                  </td>
                  <td className="py-4 pr-4 text-kov-steel">{lead.project_type || "—"}</td>
                  <td className="py-4 pr-4 text-kov-steel">
                    {lead.contact_method && isContactMethod(lead.contact_method)
                      ? CONTACT_METHOD_LABELS[lead.contact_method]
                      : "—"}
                  </td>
                  <td className="py-4 pr-4 text-kov-steel">
                    {lead.timeline && isLeadTimeline(lead.timeline) ? LEAD_TIMELINE_LABELS[lead.timeline] : "—"}
                  </td>
                  <td className="py-4 pr-4">
                    <AssignLeadSelect leadId={lead.id} assignedTo={lead.assigned_to} admins={adminOptions} />
                  </td>
                  <td className="py-4 pr-4">
                    <LeadStatusSelect leadId={lead.id} status={lead.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 text-xs text-kov-steel">
              <span>
                Page {page} / {totalPages} — {count} lead{(count ?? 0) > 1 ? "s" : ""}
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
        </div>
      )}
    </main>
  );
}
