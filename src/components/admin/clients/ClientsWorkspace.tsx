"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Search, ChevronDown, ArrowUpRight, Mail, Archive, ArchiveRestore } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ProgressBar } from "@/components/admin/ProgressBar";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { PROJECT_STATUS_LABELS, isProjectStatus } from "@/lib/portal/status";
import { archiveClient, unarchiveClient } from "@/app/admin/clients/actions";
import { ClientAvatar } from "@/components/admin/clients/ClientAvatar";
import { ConfirmDialog } from "@/components/admin/clients/ConfirmDialog";

export interface ClientRow {
  id: string;
  full_name: string | null;
  email: string;
  company: string | null;
  account_manager_id: string | null;
  avatar_url: string | null;
  archived_at: string | null;
}

export interface ManagerInfo {
  full_name: string | null;
  avatar_url: string | null;
}

export interface ClientProjectInfo {
  id: string;
  name: string;
  status: string;
  progress_percent: number;
}

export interface ClientActivityInfo {
  title: string;
  admin_title: string | null;
  created_at: string;
}

const SORTS = [
  { id: "recent", label: "Plus récent" },
  { id: "name-asc", label: "Nom A–Z" },
  { id: "name-desc", label: "Nom Z–A" },
  { id: "most-active", label: "Plus actif" },
  { id: "most-projects", label: "Plus de projets" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

type Filter = "all" | "active" | "archived";

function displayName(client: ClientRow): string {
  return client.full_name || client.company || "Client sans nom";
}

function StatusPill({ archived }: { archived: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        aria-hidden="true"
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: archived ? "var(--kov-steel)" : "#3FB27F" }}
      />
      <span className="text-kov-steel">{archived ? "Archivé" : "Actif"}</span>
    </span>
  );
}

function ProjectsCell({ projects }: { projects: ClientProjectInfo[] }) {
  const [open, setOpen] = useState(false);
  if (projects.length === 0) return <span className="text-kov-steel">0 projet</span>;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="text-kov-bone hover:text-kov-red transition-colors"
      >
        {projects.length} projet{projects.length > 1 ? "s" : ""}
      </button>
      {open && (
        <div
          className="absolute z-20 top-full left-0 mt-2 w-64 p-3"
          style={{ background: "var(--kov-graphite)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", boxShadow: "var(--glass-shadow-full)" }}
        >
          <ul className="space-y-3">
            {projects.map((p) => (
              <li key={p.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-kov-bone text-xs truncate">{p.name}</span>
                  <span className="text-kov-steel text-[10px] uppercase tracking-widest shrink-0">
                    {isProjectStatus(p.status) ? PROJECT_STATUS_LABELS[p.status] : p.status}
                  </span>
                </div>
                <ProgressBar percent={p.progress_percent} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ClientsWorkspace({
  clients,
  managers,
  projectsByClient,
  latestActivityByClient,
}: {
  clients: ClientRow[];
  managers: Record<string, ManagerInfo>;
  projectsByClient: Record<string, ClientProjectInfo[]>;
  latestActivityByClient: Record<string, ClientActivityInfo | undefined>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortId>("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ client: ClientRow; action: "archive" | "unarchive" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: clients.length,
      active: clients.filter((c) => !c.archived_at).length,
      archived: clients.filter((c) => c.archived_at).length,
    }),
    [clients]
  );

  const visible = useMemo(() => {
    let rows = clients;
    if (filter === "active") rows = rows.filter((c) => !c.archived_at);
    if (filter === "archived") rows = rows.filter((c) => c.archived_at);

    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((c) =>
        [c.full_name, c.email, c.company].some((field) => field?.toLowerCase().includes(q))
      );
    }

    const sorted = [...rows];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) => displayName(a).localeCompare(displayName(b)));
        break;
      case "name-desc":
        sorted.sort((a, b) => displayName(b).localeCompare(displayName(a)));
        break;
      case "most-active":
        sorted.sort((a, b) => {
          const at = latestActivityByClient[a.id]?.created_at ?? "";
          const bt = latestActivityByClient[b.id]?.created_at ?? "";
          return bt.localeCompare(at);
        });
        break;
      case "most-projects":
        sorted.sort((a, b) => (projectsByClient[b.id]?.length ?? 0) - (projectsByClient[a.id]?.length ?? 0));
        break;
      // "recent" — clients arrive already ordered by created_at desc from the server query.
    }
    return sorted;
  }, [clients, filter, query, sort, latestActivityByClient, projectsByClient]);

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  function runConfirmedAction() {
    if (!confirmTarget) return;
    setActionError(null);
    startTransition(async () => {
      try {
        if (confirmTarget.action === "archive") await archiveClient(confirmTarget.client.id);
        else await unarchiveClient(confirmTarget.client.id);
        setConfirmTarget(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "L'action a échoué.");
      }
    });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      <GlassCard className="p-5 lg:p-6">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <p className="text-kov-bone text-sm">Liste des clients</p>
          {filter !== "archived" ? (
            <button type="button" onClick={() => setFilter("archived")} className="text-kov-red hover:underline text-xs">
              Voir les archivés →
            </button>
          ) : (
            <button type="button" onClick={() => setFilter("all")} className="text-kov-steel hover:text-kov-red text-xs transition-colors">
              ← Retour à tous les clients
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kov-steel pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un client..."
              className="w-full bg-transparent border pl-9 pr-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(["all", "active", "archived"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors"
                style={{
                  borderRadius: "var(--radius-pill)",
                  border: `1px solid ${filter === f ? "rgba(227,30,36,0.5)" : "var(--kov-border)"}`,
                  color: filter === f ? "var(--kov-bone)" : "var(--kov-steel)",
                  background: filter === f ? "rgba(227,30,36,0.1)" : "transparent",
                }}
              >
                {filter === f && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />}
                {f === "all" ? "Tous" : f === "active" ? "Actifs" : "Archivés"}
                <span className="text-kov-steel">{counts[f]}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setSortMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setSortMenuOpen(false), 150)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-kov-steel hover:text-kov-bone transition-colors"
              style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              {SORTS.find((s) => s.id === sort)?.label}
              <ChevronDown size={13} />
            </button>
            {sortMenuOpen && (
              <div
                className="absolute z-20 right-0 top-full mt-2 py-1 whitespace-nowrap"
                style={{ background: "var(--kov-graphite)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-sm)" }}
              >
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSort(s.id)}
                    className="block w-full px-4 py-2 text-left text-xs text-kov-steel hover:text-kov-red transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState message={query ? "Aucun client ne correspond à cette recherche." : "Aucun client pour l'instant."} />
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-kov-steel border-b" style={{ borderColor: "var(--kov-border)" }}>
                    <th className="py-3 pr-4">Client</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Chef de projet</th>
                    <th className="py-3 pr-4">Projets</th>
                    <th className="py-3 pr-4">Dernière activité</th>
                    <th className="py-3 pr-4">Statut</th>
                    <th className="py-3 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((client) => {
                    const manager = client.account_manager_id ? managers[client.account_manager_id] : undefined;
                    const activity = latestActivityByClient[client.id];
                    const isSelected = selectedId === client.id;
                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedId(client.id)}
                        className="cursor-pointer align-top transition-colors duration-200"
                        style={{
                          borderBottom: "1px solid var(--kov-border)",
                          background: isSelected ? "rgba(255,255,255,0.03)" : "transparent",
                          borderLeft: `2px solid ${isSelected ? "var(--kov-red)" : "transparent"}`,
                        }}
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <ClientAvatar name={client.full_name || client.company} avatarUrl={client.avatar_url} />
                            <div className="min-w-0">
                              <p className="text-kov-bone truncate">{displayName(client)}</p>
                              {client.full_name && client.company && (
                                <p className="text-kov-steel text-xs truncate">{client.company}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-kov-steel">
                          <a href={`mailto:${client.email}`} onClick={(e) => e.stopPropagation()} className="hover:text-kov-red transition-colors">
                            {client.email}
                          </a>
                        </td>
                        <td className="py-4 pr-4">
                          {manager ? (
                            <div className="flex items-center gap-2">
                              <ClientAvatar name={manager.full_name} avatarUrl={manager.avatar_url} size={22} />
                              <span className="text-kov-steel">{manager.full_name?.split(" ")[0] ?? "—"}</span>
                            </div>
                          ) : (
                            <span className="text-kov-steel">—</span>
                          )}
                        </td>
                        <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                          <ProjectsCell projects={projectsByClient[client.id] ?? []} />
                        </td>
                        <td className="py-4 pr-4 text-kov-steel">
                          {activity ? (
                            <>
                              <p className="text-kov-bone text-xs">{formatRelativeTime(activity.created_at)}</p>
                              <p className="text-[11px] mt-0.5 truncate max-w-[160px]">{activity.admin_title ?? activity.title}</p>
                            </>
                          ) : (
                            "Aucune activité"
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <StatusPill archived={!!client.archived_at} />
                        </td>
                        <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-3 justify-end">
                            <button
                              type="button"
                              onClick={() => setConfirmTarget({ client, action: client.archived_at ? "unarchive" : "archive" })}
                              aria-label={client.archived_at ? "Réactiver" : "Archiver"}
                              className="text-kov-steel hover:text-kov-red transition-colors"
                            >
                              {client.archived_at ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                            </button>
                            <Link href={`/admin/clients/${client.id}`} className="inline-flex items-center gap-1 text-kov-red hover:underline text-xs">
                              Gérer <ArrowUpRight size={12} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile — cards, not a squeezed 7-column table (spec §33/34). */}
            <ul className="md:hidden space-y-3">
              {visible.map((client) => {
                const activity = latestActivityByClient[client.id];
                const projectCount = projectsByClient[client.id]?.length ?? 0;
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(client.id)}
                      className="w-full text-left p-4"
                      style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-md)", border: "1px solid var(--kov-border)" }}
                    >
                      <div className="flex items-center gap-3">
                        <ClientAvatar name={client.full_name || client.company} avatarUrl={client.avatar_url} />
                        <div className="min-w-0 flex-1">
                          <p className="text-kov-bone truncate">{displayName(client)}</p>
                          <p className="text-kov-steel text-xs truncate">{client.email}</p>
                        </div>
                        <StatusPill archived={!!client.archived_at} />
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-kov-steel">
                        <span>
                          {projectCount} projet{projectCount > 1 ? "s" : ""}
                        </span>
                        <span>{activity ? formatRelativeTime(activity.created_at) : "Aucune activité"}</span>
                      </div>
                      <Link href={`/admin/clients/${client.id}`} className="inline-flex items-center gap-1 text-kov-red text-xs mt-3">
                        Gérer <ArrowUpRight size={12} />
                      </Link>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </GlassCard>

      <div className="lg:sticky lg:top-6">
        {selected ? (
          <GlassCard className="p-5">
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Aperçu client</p>
            <div className="flex flex-col items-center text-center">
              <ClientAvatar name={selected.full_name || selected.company} avatarUrl={selected.avatar_url} size={56} />
              <p className="text-kov-bone mt-3">{displayName(selected)}</p>
              <p className="text-kov-steel text-xs mt-1">{selected.email}</p>
              {selected.company && selected.full_name && <p className="text-kov-steel text-xs">{selected.company}</p>}
              <div className="mt-3">
                <StatusPill archived={!!selected.archived_at} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="p-3" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Projets</p>
                <p className="text-kov-bone text-lg mt-1">{projectsByClient[selected.id]?.length ?? 0}</p>
              </div>
              <div className="p-3" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}>
                <p className="text-kov-steel text-[10px] uppercase tracking-widest">Dernière activité</p>
                <p className="text-kov-bone text-xs mt-1.5">
                  {latestActivityByClient[selected.id] ? formatRelativeTime(latestActivityByClient[selected.id]!.created_at) : "Aucune"}
                </p>
              </div>
            </div>

            <a
              href={`mailto:${selected.email}`}
              className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 text-xs uppercase tracking-widest text-kov-bone hover:text-kov-red transition-colors"
              style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              <Mail size={13} /> Écrire un email
            </a>

            <Link
              href={`/admin/clients/${selected.id}`}
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 text-xs uppercase tracking-widest text-kov-bone transition-colors"
              style={{ background: "rgba(227,30,36,0.15)", border: "1px solid rgba(227,30,36,0.4)", borderRadius: "var(--radius-sm)" }}
            >
              Voir la fiche complète <ArrowUpRight size={13} />
            </Link>
          </GlassCard>
        ) : (
          <p className="text-kov-steel text-sm text-center py-10">Sélectionnez un client pour afficher son aperçu.</p>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === "archive" ? "Archiver ce client ?" : "Réactiver ce client ?"}
        body={
          confirmTarget?.action === "archive"
            ? "Il n'apparaîtra plus dans la liste par défaut, mais rien n'est supprimé."
            : "Il réapparaîtra dans la liste par défaut."
        }
        confirmLabel={confirmTarget?.action === "archive" ? "Archiver" : "Réactiver"}
        pending={isPending}
        error={actionError}
        onConfirm={runConfirmedAction}
        onCancel={() => {
          setConfirmTarget(null);
          setActionError(null);
        }}
      />
    </div>
  );
}
