"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/Select";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS } from "@/lib/admin/status";
import { bulkUpdateLeadStatus, bulkAssignLead } from "@/app/admin/leads/actions";
import { EmptyState } from "@/components/admin/EmptyState";
import { LeadListCard } from "@/components/admin/leads/LeadListCard";
import { LeadBoard } from "./LeadBoard";
import type { LeadStatusRow } from "@/lib/leads/statuses";
import type { LeadRow, PickerOption } from "./types";

const FILTER_SELECT_CLASS = "bg-transparent border px-3 py-2 text-kov-bone text-xs uppercase tracking-widest";
const PAGE_SIZE = 25;

type SortKey = "recent" | "oldest" | "score_desc" | "value_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Plus récents" },
  { value: "oldest", label: "Plus anciens" },
  { value: "score_desc", label: "Score décroissant" },
  { value: "value_desc", label: "Valeur décroissante" },
];

export function LeadsListView({
  initialLeads,
  statuses,
  admins,
  initialView,
  todayIso,
}: {
  initialLeads: LeadRow[];
  statuses: LeadStatusRow[];
  admins: PickerOption[];
  initialView: "kanban" | "list";
  /** Fourni par le serveur : une carte qui lirait l'horloge du navigateur
   *  pendant son rendu afficherait « dépassée » d'un côté et pas de
   *  l'autre, à cheval sur minuit. */
  todayIso: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setViewState] = useState(initialView);

  // Same "compare prop during render, setState inline" resync as
  // TaskManagerView — keeps optimistic Kanban edits from ever going stale
  // against a fresh server refetch (revalidatePath after a status change).
  const [prevInitialLeads, setPrevInitialLeads] = useState(initialLeads);
  const [leads, setLeads] = useState(initialLeads);
  if (initialLeads !== prevInitialLeads) {
    setPrevInitialLeads(initialLeads);
    setLeads(initialLeads);
  }

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPending, setIsBulkPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = leads.filter((lead) => {
      if (statusFilter && lead.status !== statusFilter) return false;
      if (sourceFilter && lead.source !== sourceFilter) return false;
      if (assigneeFilter && lead.assignedTo !== assigneeFilter) return false;
      if (
        q &&
        !lead.name.toLowerCase().includes(q) &&
        !lead.email.toLowerCase().includes(q) &&
        !(lead.company?.toLowerCase().includes(q) ?? false) &&
        !(lead.phone?.toLowerCase().includes(q) ?? false)
      )
        return false;
      return true;
    });

    const sorted = [...rows];
    if (sort === "recent") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === "oldest") sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    else if (sort === "score_desc") sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    else if (sort === "value_desc") sorted.sort((a, b) => (b.budgetCents ?? 0) - (a.budgetCents ?? 0));
    return sorted;
  }, [leads, query, statusFilter, sourceFilter, assigneeFilter, sort]);

  const visible = filtered.slice(0, visibleCount);
  const hasFilters = !!(query || statusFilter || sourceFilter || assigneeFilter);

  function setView(next: "kanban" | "list") {
    setViewState(next);
    router.push(`${pathname}?view=${next}`);
  }

  function toggleSelectAll() {
    if (selectedIds.size === visible.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(visible.map((l) => l.id)));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkStatus(status: string) {
    setIsBulkPending(true);
    const ids = Array.from(selectedIds);
    const result = await bulkUpdateLeadStatus(ids, status);
    setIsBulkPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setLeads((prev) => prev.map((l) => (selectedIds.has(l.id) ? { ...l, status } : l)));
    toast.success(`${ids.length} lead${ids.length > 1 ? "s" : ""} mis à jour`);
    setSelectedIds(new Set());
  }

  async function handleBulkAssign(assignedTo: string) {
    setIsBulkPending(true);
    const ids = Array.from(selectedIds);
    const value = assignedTo || null;
    const result = await bulkAssignLead(ids, value);
    setIsBulkPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const assigneeName = admins.find((a) => a.id === value)?.label ?? null;
    setLeads((prev) => prev.map((l) => (selectedIds.has(l.id) ? { ...l, assignedTo: value, assigneeName } : l)));
    toast.success(`${ids.length} lead${ids.length > 1 ? "s" : ""} attribué${ids.length > 1 ? "s" : ""}`);
    setSelectedIds(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 border p-1" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
          {(["list", "kanban"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className="px-3 py-1.5 text-xs uppercase tracking-widest transition-colors"
              style={{
                color: view === option ? "var(--kov-white)" : "var(--kov-steel)",
                background: view === option ? "var(--kov-red)" : "transparent",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {option === "list" ? "Liste" : "Kanban"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un lead…"
          className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
        {view === "list" && (
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tous statuts"
            options={statuses.filter((s) => s.isActive).map((s) => ({ value: s.key, label: s.label }))}
            className={FILTER_SELECT_CLASS}
            style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
          />
        )}
        <Select
          value={sourceFilter}
          onChange={setSourceFilter}
          placeholder="Toutes sources"
          options={LEAD_SOURCES.map((s) => ({ value: s, label: LEAD_SOURCE_LABELS[s] }))}
          className={FILTER_SELECT_CLASS}
          style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
        />
        <Select
          value={assigneeFilter}
          onChange={setAssigneeFilter}
          placeholder="Tous les responsables"
          options={admins.map((a) => ({ value: a.id, label: a.label }))}
          className={FILTER_SELECT_CLASS}
          style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
        />
        {view === "list" && (
          <Select
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={SORT_OPTIONS}
            className={FILTER_SELECT_CLASS}
            style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
          />
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("");
              setSourceFilter("");
              setAssigneeFilter("");
            }}
            className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* « Tout sélectionner » vivait dans l'en-tête de la table. La table
          n'existe plus, la case remonte donc au-dessus de la grille, là où
          elle reste atteignable sans parcourir les cartes. */}
      {view === "list" && visible.length > 0 && (
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={selectedIds.size > 0 && selectedIds.size === visible.length}
            onChange={toggleSelectAll}
            className="accent-kov-red"
          />
          <span className="text-kov-steel text-xs uppercase tracking-widest">
            Tout sélectionner · {visible.length}
          </span>
        </label>
      )}

      {view === "list" && selectedIds.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 p-3"
          style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-red)", borderRadius: "var(--radius-sm)" }}
        >
          <span className="text-kov-bone text-xs uppercase tracking-widest">
            {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
          </span>
          <Select
            value=""
            onChange={handleBulkStatus}
            placeholder="Changer le statut…"
            disabled={isBulkPending}
            options={statuses.filter((s) => s.isActive).map((s) => ({ value: s.key, label: s.label }))}
            className={FILTER_SELECT_CLASS}
            style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
          />
          <Select
            value=""
            onChange={handleBulkAssign}
            placeholder="Attribuer à…"
            disabled={isBulkPending}
            options={[{ value: "", label: "— Aucun —" }, ...admins.map((a) => ({ value: a.id, label: a.label }))]}
            className={FILTER_SELECT_CLASS}
            style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
          />
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors ml-auto"
          >
            Effacer la sélection
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState message={hasFilters ? "Aucun lead ne correspond à ces filtres." : "Aucun lead pour l'instant."} />
      ) : view === "kanban" ? (
        <LeadBoard leads={filtered} setLeads={setLeads} statuses={statuses} />
      ) : (
        <>
          {/* La table de douze colonnes est devenue une grille de cartes.
              Douze colonnes obligeaient à défiler horizontalement pour lire
              un lead entier, et la moitié affichait « — » sur la plupart
              des lignes. La sélection groupée est conservée : la case vit
              maintenant en haut de chaque carte. */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((lead) => (
              <LeadListCard
                key={lead.id}
                lead={lead}
                statuses={statuses}
                admins={admins}
                selected={selectedIds.has(lead.id)}
                onToggleSelect={() => toggleSelect(lead.id)}
                todayIso={todayIso}
              />
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors"
              >
                Charger plus ({filtered.length - visibleCount} restants)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
