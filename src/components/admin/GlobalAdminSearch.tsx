"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export type AdminSearchItem = {
  title: string;
  subtitle?: string;
  category: "Clients" | "Projets" | "Leads" | "Devis" | "Factures" | "Documents";
  href: string;
};

const CATEGORIES = ["Tout", "Clients", "Projets", "Leads", "Devis", "Factures", "Documents"] as const;

// Prefetch-once-and-filter-client-side, same technique already proven by
// GreetingSearchPanel in the client portal — this agency's data volume
// doesn't justify a live per-keystroke Server Action (no debounce/race
// handling needed, zero new failure modes).
export function GlobalAdminSearch({ items }: { items: AdminSearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Tout");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery("");
      setCategory("Tout");
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => {
      if (category !== "Tout" && item.category !== category) return false;
      return item.title.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q);
    });
  }, [query, category, items]);

  const groupedResults = useMemo(() => {
    const groups = new Map<string, AdminSearchItem[]>();
    for (const item of results) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return groups;
  }, [results]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 text-left text-kov-steel text-sm border transition-colors hover:border-kov-red"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-lg)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="flex-1">Rechercher un client, projet, lead, devis…</span>
        <span
          className="text-[10px] uppercase tracking-widest border px-1.5 py-0.5"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          ⌘K
        </span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 flex items-start justify-center pt-24 md:pt-32 px-4"
            style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
            onClick={() => setOpen(false)}
          >
          <GlassCard className="w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div
              className="flex items-center gap-3 border-b pb-4"
              style={{ borderColor: "var(--glass-border)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-kov-steel shrink-0">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un client, projet, lead, devis…"
                className="flex-1 bg-transparent text-kov-bone placeholder:text-kov-steel focus:outline-none"
              />
              <span
                className="text-kov-steel text-[10px] uppercase tracking-widest border px-1.5 py-0.5"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
              >
                Esc
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer la recherche"
                className="text-kov-steel hover:text-kov-red transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors"
                  style={{
                    borderColor: cat === category ? "var(--kov-red)" : "var(--kov-border)",
                    color: cat === category ? "var(--kov-red)" : "var(--kov-bone)",
                    borderRadius: "var(--radius-pill)",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-6 max-h-[50vh] overflow-y-auto">
              {!query.trim() ? (
                <p className="text-kov-steel text-sm p-3">Tapez pour rechercher dans vos clients, projets et leads.</p>
              ) : results.length === 0 ? (
                <p className="text-kov-steel text-sm p-3">Aucun résultat — essayez une autre recherche.</p>
              ) : (
                Array.from(groupedResults.entries()).map(([groupCategory, groupItems]) => (
                  <div key={groupCategory} className="mb-4 last:mb-0">
                    <p className="text-kov-steel text-xs uppercase tracking-widest mb-2">{groupCategory}</p>
                    <ul className="space-y-1">
                      {groupItems.map((item) => (
                        <li key={`${item.category}-${item.href}-${item.title}`}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between gap-4 p-3 hover:bg-white/[0.04] transition-colors"
                            style={{ borderRadius: "var(--radius-sm)" }}
                          >
                            <span>
                              <span className="block text-kov-bone text-sm">{item.title}</span>
                              {item.subtitle && (
                                <span className="block text-kov-steel text-xs mt-0.5">{item.subtitle}</span>
                              )}
                            </span>
                            <span className="text-kov-red shrink-0">→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
          </div>,
          document.body
        )}
    </>
  );
}
