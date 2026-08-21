import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "Clients — Admin KOV",
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

export default async function AdminClientsPage(props: PageProps<"/admin/clients">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const showArchived = searchParams.archived === "1";
  const page = Math.max(1, parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, company, account_manager_id, created_at, archived_at", { count: "exact" })
    .eq("role", "client");

  if (!showArchived) query = query.is("archived_at", null);
  if (q) {
    const safeQ = q.replace(/[,()%]/g, "");
    query = query.or(`full_name.ilike.%${safeQ}%,email.ilike.%${safeQ}%,company.ilike.%${safeQ}%`);
  }

  const { data: clients, count } = await query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const rows = clients ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const managerIds = Array.from(new Set(rows.map((c) => c.account_manager_id).filter((id): id is string => !!id)));
  const { data: managers } = managerIds.length
    ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", managerIds)
    : { data: [] };
  const managerNameById = new Map((managers ?? []).map((m) => [m.id, m.full_name]));

  const { data: projectCounts } = rows.length
    ? await supabaseAdmin
        .from("projects")
        .select("client_id")
        .in(
          "client_id",
          rows.map((c) => c.id)
        )
    : { data: [] };
  const countByClient = new Map<string, number>();
  for (const p of projectCounts ?? []) {
    countByClient.set(p.client_id, (countByClient.get(p.client_id) ?? 0) + 1);
  }

  const baseParams = { q: q || undefined, archived: showArchived ? "1" : undefined };

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Clients</h1>
        <div className="flex items-center gap-4">
          <form method="GET" className="flex items-center gap-2">
            {showArchived && <input type="hidden" name="archived" value="1" />}
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Rechercher un client…"
              className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            />
          </form>
          <Link
            href={buildQueryString({ q: q || undefined, archived: showArchived ? undefined : "1" })}
            className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors whitespace-nowrap"
          >
            {showArchived ? "Masquer les archivés" : "Voir les archivés"}
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState message={q ? "Aucun client ne correspond à cette recherche." : "Aucun compte client pour l'instant."} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr
                className="text-xs uppercase tracking-widest text-kov-steel border-b"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <th className="py-3 pr-4">Client</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Chef de projet</th>
                <th className="py-3 pr-4">Projets</th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map((client) => (
                <tr key={client.id} className="border-b align-top" style={{ borderColor: "var(--kov-border)" }}>
                  <td className="py-4 pr-4 text-kov-bone">
                    {client.full_name || client.company || "—"}
                    {client.archived_at && (
                      <span className="ml-2 text-kov-steel text-[10px] uppercase tracking-widest border px-1.5 py-0.5" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
                        Archivé
                      </span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-kov-steel">{client.email}</td>
                  <td className="py-4 pr-4 text-kov-steel">
                    {client.account_manager_id ? managerNameById.get(client.account_manager_id) || "—" : "—"}
                  </td>
                  <td className="py-4 pr-4 text-kov-steel">{countByClient.get(client.id) ?? 0}</td>
                  <td className="py-4 pr-4">
                    <Link href={`/admin/clients/${client.id}`} className="text-kov-red hover:underline">
                      Gérer →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 text-xs text-kov-steel">
              <span>
                Page {page} / {totalPages} — {count} client{(count ?? 0) > 1 ? "s" : ""}
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
