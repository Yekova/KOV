import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ProjectTable } from "@/components/admin/dashboard/ProjectTable";

export const metadata: Metadata = {
  title: "Projets — Admin KOV",
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

export default async function AdminProjectsPage(props: PageProps<"/admin/projects">) {
  await requireAdmin();
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const page = Math.max(1, parseInt(typeof searchParams.page === "string" ? searchParams.page : "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin
    .from("projects")
    .select("id, name, status, progress_percent, next_deadline_date, client_id, project_manager_id", { count: "exact" });

  if (q) {
    const safeQ = q.replace(/[,()%]/g, "");
    query = query.or(`name.ilike.%${safeQ}%,category.ilike.%${safeQ}%`);
  }

  const { data: projects, count } = await query.order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const rows = projects ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const clientIds = Array.from(new Set(rows.map((p) => p.client_id)));
  const managerIds = Array.from(new Set(rows.map((p) => p.project_manager_id).filter((id): id is string => !!id)));

  const [{ data: clients }, { data: managers }] = await Promise.all([
    clientIds.length
      ? supabaseAdmin.from("profiles").select("id, full_name, email, company").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    managerIds.length
      ? supabaseAdmin.from("profiles").select("id, full_name, email").in("id", managerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.full_name || c.company || c.email]));
  const managerNameById = new Map((managers ?? []).map((m) => [m.id, m.full_name || m.email]));

  const tableRows = rows.map((p) => ({
    id: p.id,
    name: p.name,
    clientId: p.client_id,
    clientName: clientNameById.get(p.client_id) ?? "—",
    managerName: p.project_manager_id ? managerNameById.get(p.project_manager_id) ?? null : null,
    status: p.status,
    progressPercent: p.progress_percent,
    dueDate: p.next_deadline_date,
  }));

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Projets</h1>
        <form method="GET">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un projet…"
            className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </form>
      </div>

      <ProjectTable projects={tableRows} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-xs text-kov-steel">
          <span>
            Page {page} / {totalPages} — {count} projet{(count ?? 0) > 1 ? "s" : ""}
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
    </main>
  );
}
