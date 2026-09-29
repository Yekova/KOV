"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Portrait } from "@/components/ui/Portrait";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

// La colonne de gauche : la liste des conversations.
//
// Elle est dans un layout Next, pas dans les pages : ouvrir un fil ne doit
// pas la redessiner ni la recharger. C'est ce qui fait qu'une messagerie se
// lit comme une messagerie et non comme une suite de pages.
//
// Le même composant sert à l'admin et au client. Ils ne diffèrent que par
// ce qu'ils affichent sur chaque ligne — le studio voit le nom du client,
// le client voit le sujet — donc la différence est dans les données qu'on
// lui passe, pas dans deux copies du composant.

export interface ConversationItem {
  id: string;
  href: string;
  /** La ligne principale : le client pour le studio, le sujet pour le client. */
  title: string;
  /** La seconde ligne : le sujet pour le studio, le projet pour le client. */
  subtitle: string | null;
  excerpt: string | null;
  avatarUrl: string | null;
  at: string | null;
  /** « À vous de répondre », « En attente de KOV »… toujours doublé en couleur. */
  waitingLabel: string;
  waitingColor: string;
  /** Vrai quand la conversation attend un geste de celui qui regarde. */
  needsYou: boolean;
  messageCount: number;
  /** La présence de l'interlocuteur. undefined ne l'affiche pas du tout —
   *  c'est le cas côté client, où la conversation est avec le studio et non
   *  avec une personne dont on suivrait la disponibilité. */
  isOnline?: boolean;
}

type Filter = "todo" | "all" | "closed";

const FILTER_LABELS: Record<Filter, string> = {
  todo: "À traiter",
  all: "Toutes",
  closed: "Clôturées",
};

export function ConversationList({
  items,
  title,
  newAction,
  trash,
}: {
  items: ConversationItem[];
  title: string;
  newAction?: { label: string; href: string };
  /** Le lien vers « Supprimés récemment ». Absent, rien ne s'affiche —
   *  une corbeille vide n'a pas besoin d'occuper une ligne. */
  trash?: { href: string; count: number };
}) {
  // Le fil actif est lu dans l'URL, pas reçu en propriété : ce composant
  // vit dans un layout Next, qui ne se re-rend pas quand le paramètre de
  // route change. Une propriété resterait donc figée sur le premier fil
  // ouvert.
  const pathname = usePathname();
  const hasTodo = items.some((item) => item.needsYou);
  const [filter, setFilter] = useState<Filter>(hasTodo ? "todo" : "all");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => ({
      todo: items.filter((item) => item.needsYou).length,
      all: items.length,
      closed: items.filter((item) => item.waitingLabel === "Clôturée").length,
    }),
    [items]
  );

  const visible = useMemo(() => {
    let rows = items;
    if (filter === "todo") rows = rows.filter((item) => item.needsYou);
    if (filter === "closed") rows = rows.filter((item) => item.waitingLabel === "Clôturée");
    const needle = query.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((item) =>
        [item.title, item.subtitle, item.excerpt]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(needle))
      );
    }
    return rows;
  }, [items, filter, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-5 pt-6">
        <h1 className="font-display text-lg uppercase text-kov-bone">
          {title}
          <span className="text-kov-red">.</span>
        </h1>

        {newAction && (
          <Link
            href={newAction.href}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 text-xs uppercase tracking-widest text-kov-white transition-colors hover:brightness-110"
            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
          >
            {newAction.label}
            <span aria-hidden="true">→</span>
          </Link>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {(["todo", "all", "closed"] as Filter[])
            // Un onglet à zéro disparaît plutôt que de rester à dire zéro.
            .filter((id) => counts[id] > 0 || id === "all")
            .map((id) => {
              const isActive = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  aria-pressed={isActive}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] uppercase tracking-widest transition-colors"
                  style={{
                    borderRadius: "var(--radius-pill)",
                    border: `1px solid ${isActive ? "rgba(227,30,36,0.5)" : "var(--kov-border)"}`,
                    color: isActive ? "var(--kov-bone)" : "var(--kov-concrete)",
                    background: isActive ? "rgba(227,30,36,0.1)" : "transparent",
                  }}
                >
                  {FILTER_LABELS[id]}
                  <span className="tabular-nums text-kov-concrete">{counts[id]}</span>
                </button>
              );
            })}
        </div>

        {/* La corbeille est un LIEN et non un quatrième onglet : ce n'est
            pas un filtre sur la même liste mais un autre endroit, dont on
            ressort. La mêler aux onglets ferait croire qu'une conversation
            supprimée est toujours là, simplement masquée. */}
        {trash && trash.count > 0 && (
          <div className="mt-3">
            <Link
              href={trash.href}
              className="text-kov-concrete hover:text-kov-bone inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors"
            >
              Supprimés récemment
              <span className="tabular-nums">{trash.count}</span>
            </Link>
          </div>
        )}

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Rechercher une conversation"
          placeholder="Rechercher…"
          className="kov-field mt-3 w-full border bg-transparent px-3 py-2 text-sm text-kov-bone placeholder:text-kov-concrete/70 focus:outline-none"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        {visible.length === 0 ? (
          <p className="px-2 py-6 text-sm text-kov-concrete">
            {query ? `Rien ne correspond à « ${query.trim()} ».` : "Aucune conversation dans ce filtre."}
          </p>
        ) : (
          <ul className="space-y-1">
            {visible.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className="kov-conversation flex gap-3 p-3"
                    data-active={isActive}
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <Portrait src={item.avatarUrl} name={item.title} size={36} isOnline={item.isOnline} />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm text-kov-bone">{item.title}</span>
                        {item.at && (
                          <span className="shrink-0 text-[11px] text-kov-concrete">{formatRelativeTime(item.at)}</span>
                        )}
                      </span>

                      {item.subtitle && (
                        <span className="mt-0.5 block truncate text-xs text-kov-concrete">{item.subtitle}</span>
                      )}
                      {item.excerpt && (
                        <span className="mt-1 block truncate text-xs text-kov-concrete/75">{item.excerpt}</span>
                      )}

                      <span className="mt-1.5 flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest"
                          style={{ color: item.waitingColor }}
                        >
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: item.waitingColor }}
                          />
                          {item.waitingLabel}
                        </span>
                        <span className="text-[10px] tabular-nums text-kov-concrete">
                          {item.messageCount} msg
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
