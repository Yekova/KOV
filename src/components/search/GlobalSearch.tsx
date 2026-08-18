"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { searchIndex } from "@/data/searchIndex";
import { GlassCard } from "@/components/ui/GlassCard";

const CATEGORIES = ["All", "Expertise", "Studio", "Work", "Contact"] as const;

const SUGGESTIONS = ["What services do you offer?", "Show me your work", "How do you work?"];

const QUICK_LINKS = [
  { title: "Start a project", href: "/contact" },
  { title: "View expertise", href: "/expertise" },
  { title: "About the studio", href: "/studio" },
  { title: "View work", href: "/#work" },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
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
      setCategory("All");
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="w-10 h-10 flex items-center justify-center text-kov-bone hover:text-kov-red transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 flex items-start justify-center pt-24 md:pt-32 px-4"
          style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
          onClick={() => setOpen(false)}
        >
          <GlassCard className="w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--glass-border)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-kov-steel shrink-0">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything…"
                className="flex-1 bg-transparent text-kov-bone placeholder:text-kov-steel focus:outline-none"
              />
              <span className="text-kov-steel text-[10px] uppercase tracking-widest border px-1.5 py-0.5" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
                Esc
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="text-kov-steel hover:text-kov-red transition-colors">
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
              {query.trim() ? (
                results.length > 0 ? (
                  <ul className="space-y-1">
                    {results.map((item) => (
                      <li key={item.title}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex items-center justify-between gap-4 p-3 hover:bg-white/[0.04] transition-colors"
                          style={{ borderRadius: "var(--radius-sm)" }}
                        >
                          <span>
                            <span className="block text-kov-bone text-sm">{item.title}</span>
                            <span className="block text-kov-steel text-xs uppercase tracking-widest mt-0.5">
                              {item.category}
                            </span>
                          </span>
                          <span className="text-kov-red shrink-0">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-kov-steel text-sm p-3">No results — try a different search.</p>
                )
              ) : (
                <>
                  <p className="text-kov-steel text-xs uppercase tracking-widest mb-3">Suggested searches</p>
                  <ul className="space-y-1 mb-6">
                    {SUGGESTIONS.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => setQuery(s)}
                          className="w-full text-left flex items-center justify-between gap-4 p-3 text-kov-bone text-sm hover:bg-white/[0.04] transition-colors"
                          style={{ borderRadius: "var(--radius-sm)" }}
                        >
                          {s}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-kov-steel shrink-0">
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <p className="text-kov-steel text-xs uppercase tracking-widest mb-3">Quick links</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_LINKS.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-2 p-3 border text-kov-bone text-sm hover:border-kov-red hover:text-kov-red transition-colors"
                        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                      >
                        {link.title}
                        <span>→</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
}
