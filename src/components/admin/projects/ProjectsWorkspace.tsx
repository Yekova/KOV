"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ArrowUpRight, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/admin/EmptyState";
import { ClientAvatar } from "@/components/admin/clients/ClientAvatar";
import { updateProject } from "@/app/admin/clients/actions";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, isProjectStatus } from "@/lib/portal/status";
import { CreateProjectModal } from "@/components/admin/projects/CreateProjectModal";

export interface ProjectRow {
  id: string;
  name: string;
  category: string;
  status: string;
  next_deadline_date: string | null;
  created_at: string;
  thumbnail_url: string | null;
  client_id: string;
  client_name: string;
  client_company: string | null;
  client_avatar_url: string | null;
}

type PickerOption = { id: string; label: string };

const PAGE_SIZE = 20;

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  ...PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] })),
];

const STATUS_DOT: Record<string, string> = {
  in_progress: "#3FB27F",
  in_review: "#F5A524",
  done: "var(--kov-steel)",
  on_hold: "var(--kov-muted)",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function StatusSelect({ projectId, status }: { projectId: string; status: string }) {
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      onChange={(next) => {
        if (!isProjectStatus(next) || next === value) return;
        const previous = value;
        setValue(next);
        startTransition(async () => {
          try {
            const fd = new FormData();
            fd.set("status", next);
            await updateProject(projectId, fd);
          } catch {
            setValue(previous);
          }
        });
      }}
      disabled={isPending}
      options={PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))}
      className="px-3 py-1.5 text-xs"
      style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-pill)", background: "var(--kov-graphite)" }}
    />
  );
}

function RowMenu({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Plus d'actions"
        className="w-8 h-8 flex items-center justify-center text-kov-steel hover:text-kov-bone transition-colors"
        style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div
          className="absolute z-20 right-0 top-full mt-2 py-1 whitespace-nowrap"
          style={{ background: "var(--kov-graphite)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)" }}
        >
          <Link href={`/admin/clients/${clientId}`} className="block px-4 py-2 text-left text-xs text-kov-steel hover:text-kov-red transition-colors">
            Voir la fiche client →
          </Link>
        </div>
      )}
    </div>
  );
}

export function ProjectsWorkspace({
  projects,
  clientOptions,
  adminOptions,
}: {
  projects: ProjectRow[];
  clientOptions: PickerOption[];
  adminOptions: PickerOption[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    let rows = projects;
    if (statusFilter !== "all") rows = rows.filter((p) => p.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    return rows;
  }, [projects, statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const visible = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kov-steel pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un projet..."
            className="w-full bg-transparent border pl-9 pr-3 py-2.5 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={STATUS_FILTER_OPTIONS}
          className="px-3 py-2.5 text-sm min-w-[160px]"
          style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />

        <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
          + Nouveau projet
        </Button>
      </div>

      <GlassCard className="p-5 lg:p-6">
        {visible.length === 0 ? (
          <EmptyState message={query || statusFilter !== "all" ? "Aucun projet ne correspond à ces critères." : "Aucun projet pour l'instant."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                  <th className="py-3 pr-4">Projet</th>
                  <th className="py-3 pr-4">Client</th>
                  <th className="py-3 pr-4">Statut</th>
                  <th className="py-3 pr-4">Date de création</th>
                  <th className="py-3 pr-4">Date de livraison</th>
                  <th className="py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {visible.map((project) => (
                  <tr key={project.id} className="align-middle" style={{ borderBottom: "1px solid var(--kov-border)" }}>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-9 shrink-0 overflow-hidden" style={{ borderRadius: "var(--radius-sm)", background: "var(--kov-graphite)" }}>
                          {project.thumbnail_url && <Image src={project.thumbnail_url} alt="" fill sizes="48px" className="object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/projects/${project.id}`} className="text-kov-bone hover:text-kov-red transition-colors uppercase text-xs tracking-wide">
                            {project.name}
                          </Link>
                          <p className="text-kov-steel text-xs">{project.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <ClientAvatar name={project.client_name} avatarUrl={project.client_avatar_url} size={26} />
                        <div className="min-w-0">
                          <p className="text-kov-bone text-xs truncate">{project.client_name}</p>
                          {project.client_company && <p className="text-kov-steel text-[11px] truncate">{project.client_company}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_DOT[project.status] ?? "var(--kov-steel)" }} />
                        <StatusSelect projectId={project.id} status={project.status} />
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-kov-steel text-xs whitespace-nowrap">{formatDate(project.created_at)}</td>
                    <td className="py-3.5 pr-4 text-kov-steel text-xs whitespace-nowrap">
                      {project.next_deadline_date ? formatDate(project.next_deadline_date) : "—"}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest text-kov-bone transition-colors"
                          style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                        >
                          Gérer <ArrowUpRight size={12} />
                        </Link>
                        <RowMenu clientId={project.client_id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between mt-6 text-xs text-kov-steel">
            <span>
              {(clampedPage - 1) * PAGE_SIZE + 1}–{Math.min(clampedPage * PAGE_SIZE, filtered.length)} sur {filtered.length} projet
              {filtered.length > 1 ? "s" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={clampedPage === 1}
                  className="w-7 h-7 flex items-center justify-center disabled:opacity-30 hover:text-kov-red transition-colors"
                  style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                >
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className="w-7 h-7 flex items-center justify-center text-xs transition-colors"
                    style={{
                      border: `1px solid ${n === clampedPage ? "var(--kov-red)" : "var(--kov-border)"}`,
                      borderRadius: "var(--radius-sm)",
                      color: n === clampedPage ? "var(--kov-bone)" : "var(--kov-steel)",
                      background: n === clampedPage ? "rgba(227,30,36,0.12)" : "transparent",
                    }}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={clampedPage === totalPages}
                  className="w-7 h-7 flex items-center justify-center disabled:opacity-30 hover:text-kov-red transition-colors"
                  style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {createOpen && <CreateProjectModal clients={clientOptions} admins={adminOptions} onClose={() => setCreateOpen(false)} />}
    </>
  );
}
