"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/admin/EmptyState";
import { archiveClient, unarchiveClient } from "@/app/admin/clients/actions";
import { ConfirmDialog } from "@/components/admin/clients/ConfirmDialog";
import { ClientCard } from "@/components/admin/clients/ClientCard";
import type { ClientSummary } from "@/lib/admin/clients";

// La liste des clients, en grille de cartes.
//
// C'était une table : nom, email, chef de projet, nombre de projets, date.
// Une table répond à « qui sont mes clients » ; la question qu'on se pose en
// ouvrant cet écran est « où en est chacun, et qu'est-ce qui tombe ». Une
// ligne de tableau n'a pas la place d'y répondre, une carte si.
//
// Le panneau latéral d'aperçu disparaît avec la table, et c'est voulu : il
// affichait le nom, l'email, le nombre de projets et la dernière activité,
// tous désormais sur la carte elle-même. Garder un panneau pour redire ce
// qui est déjà à l'écran aurait coûté un tiers de la largeur.
//
// Le filtrage, le tri et la recherche restent côté client, sur une seule
// lecture : c'est la convention de cet admin, et c'est aussi la seule façon
// d'afficher les compteurs de tous les onglets en même temps.

const SORTS = [
  { id: "recent", label: "Plus récent" },
  { id: "deadline", label: "Échéance la plus proche" },
  { id: "activity", label: "Activité la plus récente" },
  { id: "name-asc", label: "Nom A–Z" },
  { id: "progress", label: "Avancement" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

type TabId = "all" | "in_progress" | "in_review" | "on_hold" | "done" | "no_project" | "archived";

const TAB_LABELS: Record<TabId, string> = {
  all: "Tous",
  in_progress: "En cours",
  in_review: "En validation",
  on_hold: "En attente",
  done: "Terminés",
  no_project: "Sans projet",
  archived: "Archivés",
};

const TAB_ORDER: TabId[] = ["all", "in_progress", "in_review", "on_hold", "done", "no_project", "archived"];

function displayName(client: ClientSummary): string {
  return client.company?.trim() || client.fullName?.trim() || client.email || "Client sans nom";
}

function matchesTab(client: ClientSummary, tab: TabId): boolean {
  // Les archivés ne se mélangent jamais aux actifs : un client archivé n'est
  // pas « en cours », quel que soit l'état de ses anciens projets.
  if (tab === "archived") return Boolean(client.archivedAt);
  if (client.archivedAt) return false;
  if (tab === "all") return true;
  if (tab === "no_project") return client.leadProject === null;
  return client.status === tab;
}

export function ClientsWorkspace({ clients }: { clients: ClientSummary[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [sort, setSort] = useState<SortId>("recent");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ client: ClientSummary; action: "archive" | "unarchive" } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result = {} as Record<TabId, number>;
    for (const id of TAB_ORDER) result[id] = clients.filter((client) => matchesTab(client, id)).length;
    return result;
  }, [clients]);

  // Seuls les onglets qui ont quelque chose à montrer. Cinq onglets à zéro
  // sur deux clients occuperaient une ligne entière pour ne rien dire.
  const visibleTabs = useMemo(
    () => TAB_ORDER.filter((id) => id === "all" || counts[id] > 0),
    [counts]
  );

  const visible = useMemo(() => {
    let rows = clients.filter((client) => matchesTab(client, tab));

    const needle = query.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((client) =>
        [client.company, client.fullName, client.email, client.leadProject?.name]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(needle))
      );
    }

    const sorted = [...rows];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) => displayName(a).localeCompare(displayName(b)));
        break;
      case "deadline":
        // Une échéance absente passe après une échéance connue. Ne rien
        // savoir n'est pas urgent, et remonter ces clients en tête ferait
        // descendre ceux qui ont une vraie date.
        sorted.sort((a, b) => {
          const left = a.leadProject?.nextDeadlineDate;
          const right = b.leadProject?.nextDeadlineDate;
          if (left && right) return left.localeCompare(right);
          if (left) return -1;
          if (right) return 1;
          return 0;
        });
        break;
      case "activity":
        sorted.sort((a, b) => {
          const left = a.lastActivity?.createdAt ?? "";
          const right = b.lastActivity?.createdAt ?? "";
          return right.localeCompare(left);
        });
        break;
      case "progress":
        sorted.sort((a, b) => (b.leadProject?.progressPercent ?? -1) - (a.leadProject?.progressPercent ?? -1));
        break;
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return sorted;
  }, [clients, tab, query, sort]);

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
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[240px]">
          {visibleTabs.map((id) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={isActive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest transition-colors"
                style={{
                  borderRadius: "var(--radius-pill)",
                  border: `1px solid ${isActive ? "rgba(227,30,36,0.5)" : "var(--kov-border)"}`,
                  color: isActive ? "var(--kov-bone)" : "var(--kov-steel)",
                  background: isActive ? "rgba(227,30,36,0.1)" : "transparent",
                }}
              >
                {TAB_LABELS[id]}
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un client, un projet…"
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
      </div>

      {visible.length === 0 ? (
        <EmptyState
          message={query ? "Aucun client ne correspond à cette recherche" : "Aucun client dans cet onglet"}
          description={
            query
              ? "La recherche porte sur le nom, la société et l'adresse email."
              : "Un client naît de la conversion d'un lead : ouvrez sa fiche et choisissez « Convertir en client ». Le compte est créé et l'invitation part dans la foulée."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onArchive={(target) => setConfirmTarget({ client: target, action: "archive" })}
              onUnarchive={(target) => setConfirmTarget({ client: target, action: "unarchive" })}
            />
          ))}
        </div>
      )}

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
