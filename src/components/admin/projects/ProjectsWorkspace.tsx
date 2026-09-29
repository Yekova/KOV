"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/admin/EmptyState";
import { ProjectCard } from "@/components/admin/projects/ProjectCard";
import { CreateProjectModal } from "@/components/admin/projects/CreateProjectModal";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/portal/status";
import type { ProjectSummary } from "@/lib/admin/projects";

// La liste des projets, en grille de cartes.
//
// C'était une table de six colonnes qui ne portait pas l'avancement. Le
// remplacement n'est pas cosmétique : la carte répond à « où en est ce
// projet » sans ouvrir sa fiche, ce que la table ne savait pas faire.
//
// La pagination à vingt disparaît au profit d'un « voir plus » : à ce
// volume, une barre de pages occupait plus de place que les projets qu'elle
// paginait, et elle obligeait à retenir sur quelle page se trouvait quoi.

type PickerOption = { id: string; label: string };

const SORTS = [
  { id: "recent", label: "Plus récent" },
  { id: "deadline", label: "Échéance la plus proche" },
  { id: "progress", label: "Le moins avancé" },
  { id: "name-asc", label: "Nom A–Z" },
  { id: "client", label: "Par client" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const PAGE_SIZE = 24;

export function ProjectsWorkspace({
  projects,
  clientOptions,
  adminOptions,
}: {
  projects: ProjectSummary[];
  clientOptions: PickerOption[];
  adminOptions: PickerOption[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortId>("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: projects.length };
    for (const status of PROJECT_STATUSES) {
      result[status] = projects.filter((project) => project.status === status).length;
    }
    return result;
  }, [projects]);

  // Un onglet vide n'apprend rien et prend une place réelle sur la ligne.
  const visibleTabs = useMemo(
    () => ["all", ...PROJECT_STATUSES.filter((status) => counts[status] > 0)],
    [counts]
  );

  const filtered = useMemo(() => {
    let rows = statusFilter === "all" ? projects : projects.filter((project) => project.status === statusFilter);

    const needle = query.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((project) =>
        [project.name, project.category, project.clientName, project.currentPhaseName]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(needle))
      );
    }

    const sorted = [...rows];
    switch (sort) {
      case "deadline":
        // Sans date, un projet passe après ceux qui en ont une : ne rien
        // savoir n'est pas une urgence.
        sorted.sort((a, b) => {
          if (a.nextDeadlineDate && b.nextDeadlineDate) return a.nextDeadlineDate.localeCompare(b.nextDeadlineDate);
          if (a.nextDeadlineDate) return -1;
          if (b.nextDeadlineDate) return 1;
          return 0;
        });
        break;
      case "progress":
        sorted.sort((a, b) => a.progressPercent - b.progressPercent);
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "client":
        sorted.sort((a, b) => a.clientName.localeCompare(b.clientName) || a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [projects, statusFilter, query, sort]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[240px]">
          {visibleTabs.map((id) => {
            const isActive = statusFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setStatusFilter(id);
                  setVisibleCount(PAGE_SIZE);
                }}
                aria-pressed={isActive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors"
                style={{
                  borderRadius: "var(--radius-pill)",
                  border: `1px solid ${isActive ? "rgba(227,30,36,0.5)" : "var(--kov-border)"}`,
                  color: isActive ? "var(--kov-bone)" : "var(--kov-steel)",
                  background: isActive ? "rgba(227,30,36,0.1)" : "transparent",
                }}
              >
                {id === "all" ? "Tous" : PROJECT_STATUS_LABELS[id as (typeof PROJECT_STATUSES)[number]]}
                <span className="text-kov-steel tabular-nums">{counts[id]}</span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kov-steel pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Rechercher un projet, un client…"
            className="w-full bg-transparent border pl-9 pr-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setSortMenuOpen((value) => !value)}
            onBlur={() => setTimeout(() => setSortMenuOpen(false), 150)}
            aria-expanded={sortMenuOpen}
            className="flex items-center gap-2 px-3 py-2 text-xs text-kov-steel hover:text-kov-bone transition-colors"
            style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            {SORTS.find((entry) => entry.id === sort)?.label}
            <ChevronDown size={13} />
          </button>
          {sortMenuOpen && (
            <div
              className="absolute z-20 right-0 top-full mt-2 py-1 whitespace-nowrap"
              style={{
                background: "var(--kov-graphite)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {SORTS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSort(entry.id);
                    setSortMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-xs text-kov-steel hover:text-kov-red transition-colors"
                >
                  {entry.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
          + Nouveau projet
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          message={
            query || statusFilter !== "all"
              ? "Aucun projet ne correspond à ces critères"
              : "Aucun projet pour l'instant"
          }
          description={
            query || statusFilter !== "all"
              ? "Élargissez la recherche ou repassez le filtre sur tous les statuts."
              : "Un projet se crée depuis la fiche d'un client, ou pendant la conversion d'un lead. C'est lui qui porte les phases que le client suit dans son espace."
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {filtered.length > visible.length && (
            <div className="flex justify-center mt-6">
              <button
                type="button"
                onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}
                className="px-5 py-2.5 border text-xs uppercase tracking-widest text-kov-steel hover:text-kov-bone hover:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                Voir plus · {filtered.length - visible.length} restants
              </button>
            </div>
          )}
        </>
      )}

      {/* La modale se monte à l'ouverture : elle rend un <Modal open> en
          dur, donc la garder montée la laisserait affichée en permanence. */}
      {createOpen && (
        <CreateProjectModal
          clients={clientOptions}
          admins={adminOptions}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </>
  );
}
