"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/EmptyState";
import { ClientAvatar } from "@/components/admin/clients/ClientAvatar";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { setRequestThreadStatus } from "@/app/admin/requests/actions";
import type { RequestThreadSummary, WaitingOn } from "@/lib/admin/requests";

// Le tableau des demandes.
//
// Une table, pas des cartes — contrairement aux clients et aux projets. Une
// demande n'a pas d'états multiples à montrer : elle a un sujet, un client,
// une date et une question, « qui doit jouer ». C'est une FILE qu'on trie,
// et une file se lit en colonnes alignées. Des cartes obligeraient l'œil à
// repartir de zéro à chaque ligne.
//
// ── L'ONGLET PAR DÉFAUT EST « À TRAITER » ────────────────────────────────
//
// Pas « Toutes ». Ouvrir cet écran, c'est demander ce qui attend une
// réponse ; l'archive se consulte, elle ne s'impose pas.

type TabId = "us" | "client" | "closed" | "all";

const TAB_LABELS: Record<TabId, string> = {
  us: "À traiter",
  client: "En attente du client",
  closed: "Clôturées",
  all: "Toutes",
};

const TAB_ORDER: TabId[] = ["us", "client", "closed", "all"];

const WAITING_COLORS: Record<WaitingOn, string> = {
  us: "var(--kov-red)",
  client: "#F5A524",
  nobody: "var(--kov-steel)",
};

const WAITING_LABELS: Record<WaitingOn, string> = {
  us: "Chez nous",
  client: "Chez le client",
  nobody: "Clôturée",
};

function matchesTab(thread: RequestThreadSummary, tab: TabId): boolean {
  if (tab === "all") return true;
  if (tab === "closed") return thread.status === "closed";
  return thread.status !== "closed" && thread.waitingOn === tab;
}

export function RequestsTable({ threads }: { threads: RequestThreadSummary[] }) {
  const [tab, setTab] = useState<TabId>("us");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const result = {} as Record<TabId, number>;
    for (const id of TAB_ORDER) result[id] = threads.filter((thread) => matchesTab(thread, id)).length;
    return result;
  }, [threads]);

  const visible = useMemo(() => {
    let rows = threads.filter((thread) => matchesTab(thread, tab));
    const needle = query.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((thread) =>
        [thread.subject, thread.clientName, thread.projectName, thread.lastMessageExcerpt]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(needle))
      );
    }
    // Ce qui attend le plus longtemps remonte : dans une file, l'ancienneté
    // est l'urgence.
    return [...rows].sort((a, b) => {
      if (a.waitingOn === "us" && b.waitingOn !== "us") return -1;
      if (b.waitingOn === "us" && a.waitingOn !== "us") return 1;
      return (a.lastMessageAt ?? a.createdAt).localeCompare(b.lastMessageAt ?? b.createdAt) * (a.waitingOn === "us" ? 1 : -1);
    });
  }, [threads, tab, query]);

  function changeStatus(threadId: string, status: "closed" | "open") {
    startTransition(async () => {
      const result = await setRequestThreadStatus(threadId, status);
      if (result.error) toast.error(result.error);
      else toast.success(status === "closed" ? "Demande clôturée." : "Demande rouverte.");
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[240px]">
          {TAB_ORDER.map((id) => {
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

        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kov-steel pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un sujet, un client…"
            className="w-full bg-transparent border pl-9 pr-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          message={
            query
              ? "Aucune demande ne correspond à cette recherche."
              : tab === "us"
                ? "Rien à traiter. Les demandes envoyées depuis les espaces clients arrivent ici."
                : "Aucune demande dans cet onglet."
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[62rem]">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--kov-border)" }}>
                <th className="text-left py-3 pr-4 text-[11px] uppercase tracking-widest text-kov-steel font-normal">Attente</th>
                <th className="text-left py-3 pr-4 text-[11px] uppercase tracking-widest text-kov-steel font-normal">Demande</th>
                <th className="text-left py-3 pr-4 text-[11px] uppercase tracking-widest text-kov-steel font-normal">Client</th>
                <th className="text-left py-3 pr-4 text-[11px] uppercase tracking-widest text-kov-steel font-normal">Projet</th>
                <th className="text-right py-3 pr-4 text-[11px] uppercase tracking-widest text-kov-steel font-normal">Messages</th>
                <th className="text-left py-3 pr-4 text-[11px] uppercase tracking-widest text-kov-steel font-normal">Dernier message</th>
                <th className="text-right py-3 text-[11px] uppercase tracking-widest text-kov-steel font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((thread) => (
                <tr key={thread.id} className="border-b align-top" style={{ borderColor: "var(--kov-border)" }}>
                  <td className="py-4 pr-4 whitespace-nowrap">
                    {/* La couleur est doublée par le mot : une file qu'on ne
                        peut trier que par teinte n'est pas une file. */}
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px]"
                      style={{ color: WAITING_COLORS[thread.waitingOn] }}
                    >
                      <span
                        aria-hidden="true"
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: WAITING_COLORS[thread.waitingOn] }}
                      />
                      {WAITING_LABELS[thread.waitingOn]}
                    </span>
                    {thread.waitingDays !== null && (
                      <span className="block text-kov-steel text-[11px] mt-0.5 tabular-nums">
                        depuis {thread.waitingDays} jour{thread.waitingDays > 1 ? "s" : ""}
                      </span>
                    )}
                  </td>

                  <td className="py-4 pr-4 max-w-[22rem]">
                    <Link
                      href={`/admin/requests/${thread.id}`}
                      className="text-kov-bone hover:text-kov-red transition-colors"
                    >
                      {thread.subject}
                    </Link>
                    {thread.lastMessageExcerpt && (
                      <p className="text-kov-steel text-[11px] mt-0.5 truncate">{thread.lastMessageExcerpt}</p>
                    )}
                  </td>

                  <td className="py-4 pr-4">
                    <Link
                      href={`/admin/clients/${thread.clientId}`}
                      className="flex items-center gap-2 min-w-0 group"
                    >
                      <ClientAvatar name={thread.clientName} avatarUrl={thread.clientAvatarUrl} size={24} />
                      <span className="text-kov-concrete text-xs truncate group-hover:text-kov-red transition-colors">
                        {thread.clientName}
                      </span>
                    </Link>
                  </td>

                  <td className="py-4 pr-4 text-kov-steel text-xs">
                    {thread.projectId ? (
                      <Link href={`/admin/projects/${thread.projectId}`} className="hover:text-kov-red transition-colors">
                        {thread.projectName}
                      </Link>
                    ) : (
                      "Aucun"
                    )}
                  </td>

                  <td className="py-4 pr-4 text-right text-kov-concrete text-xs tabular-nums">{thread.messageCount}</td>

                  <td className="py-4 pr-4 text-kov-steel text-xs whitespace-nowrap">
                    {thread.lastMessageAt ? (
                      <>
                        <span className="text-kov-concrete">
                          {thread.lastMessageBy === "admin" ? "Nous" : thread.clientName}
                        </span>
                        <span className="block">{formatRelativeTime(thread.lastMessageAt)}</span>
                      </>
                    ) : (
                      "Aucun message"
                    )}
                  </td>

                  <td className="py-4 text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      <Link
                        href={`/admin/requests/${thread.id}`}
                        className="px-3 py-1.5 border text-[11px] uppercase tracking-widest text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors"
                        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                      >
                        {thread.waitingOn === "us" ? "Répondre" : "Ouvrir"}
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => changeStatus(thread.id, thread.status === "closed" ? "open" : "closed")}
                        className="px-3 py-1.5 border text-[11px] uppercase tracking-widest text-kov-steel hover:text-kov-bone transition-colors disabled:opacity-50"
                        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                      >
                        {thread.status === "closed" ? "Rouvrir" : "Clore"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
