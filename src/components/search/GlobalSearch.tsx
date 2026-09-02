"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import type { SearchItem } from "@/data/searchIndex";
import { searchKov } from "@/lib/search";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, LIQUID_EASE } from "@/lib/motion";

const REVEAL_DURATION_MS = motion.slow * 1000;

const CATEGORIES = ["Tout", "Expertise", "Studio", "Projets", "Contact"] as const;

const SUGGESTIONS = ["Quels services proposez-vous ?", "Montrez-moi vos projets", "Comment travaillez-vous ?"];

const QUICK_LINKS = [
  { title: "Démarrer un projet", href: "/contact" },
  { title: "Voir l'expertise", href: "/expertise" },
  { title: "À propos du studio", href: "/studio" },
  { title: "Voir les projets", href: "/#work-gallery" },
];

// Staggered cascade-in for whatever's showing when the modal opens
// (suggestions/quick-links, or already-typed results) — driven by the
// same `visible` flag as the clip-path reveal, not replayed per
// keystroke: a search result list re-fading on every character typed
// reads as laggy, not fluid, so live query updates render instantly like
// any normal search UI.
function staggerStyle(visible: boolean, index: number) {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(6px)",
    transition: "opacity 0.4s, transform 0.4s",
    transitionDelay: visible ? `${Math.min(index, 8) * 35}ms` : "0ms",
  } as const;
}

const CATEGORY_TAG_STYLE = {
  borderColor: "var(--kov-border)",
  color: "var(--kov-steel)",
  borderRadius: "var(--radius-pill)",
} as const;

function ResultRow({ item, index, visible, onNavigate }: { item: SearchItem; index: number; visible: boolean; onNavigate: () => void }) {
  return (
    <li style={staggerStyle(visible, index)}>
      <Link
        href={item.href}
        onClick={onNavigate}
        className="group flex items-center justify-between gap-4 p-3.5 hover:bg-white/[0.04] transition-colors"
        style={{ borderRadius: "var(--radius-sm)" }}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-kov-bone text-sm">{item.title}</span>
            <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border shrink-0" style={CATEGORY_TAG_STYLE}>
              {item.category}
            </span>
          </span>
          <span className="block text-kov-steel text-xs mt-1 truncate">{item.description}</span>
        </span>
        <span className="text-kov-red shrink-0 transition-transform duration-300 group-hover:translate-x-1">→</span>
      </Link>
    </li>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0, radius: 0 });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Tout");
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openSearch(clientX?: number, clientY?: number) {
    const rect = triggerRef.current?.getBoundingClientRect();
    const x = clientX ?? (rect ? rect.left + rect.width / 2 : window.innerWidth - 40);
    const y = clientY ?? (rect ? rect.top + rect.height / 2 : 40);
    const radius = Math.hypot(window.innerWidth, window.innerHeight);
    setOrigin({ x, y, radius });
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }

  function closeSearch() {
    setVisible(false);
    closeTimeoutRef.current = setTimeout(() => setOpen(false), REVEAL_DURATION_MS);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) closeSearch();
        else openSearch();
      }
      if (event.key === "Escape") closeSearch();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery("");
      setCategory("Tout");
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const [results, setResults] = useState<SearchItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    searchKov(query, category).then((items) => {
      if (!cancelled) setResults(items);
    });
    return () => {
      cancelled = true;
    };
  }, [query, category]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => openSearch(e.clientX, e.clientY)}
        aria-label="Rechercher"
        className="w-9 h-9 flex items-center justify-center text-kov-bone hover:text-kov-red transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 flex items-start justify-center pt-24 md:pt-32 px-4"
            style={{
              zIndex: "var(--z-modal)",
              background: "rgba(10,10,10,0.7)",
              clipPath: `circle(${visible ? origin.radius : 0}px at ${origin.x}px ${origin.y}px)`,
              transition: `clip-path ${motion.slow}s ${LIQUID_EASE}`,
            }}
            onClick={closeSearch}
          >
            <GlassCard className="w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 min-w-0 p-6">
                  <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--glass-border)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-kov-steel shrink-0">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rechercher…"
                      className="flex-1 bg-transparent text-kov-bone placeholder:text-kov-steel focus:outline-none text-base"
                    />
                    <span className="text-kov-steel text-[10px] uppercase tracking-widest border px-1.5 py-0.5" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
                      Esc
                    </span>
                    <button type="button" onClick={closeSearch} aria-label="Fermer la recherche" className="text-kov-steel hover:text-kov-red transition-colors">
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
                          {results.map((item, index) => (
                            <ResultRow key={item.title} item={item} index={index} visible={visible} onNavigate={closeSearch} />
                          ))}
                        </ul>
                      ) : (
                        <p className="text-kov-steel text-sm p-3">Aucun résultat — essayez une autre recherche.</p>
                      )
                    ) : (
                      <>
                        <p className="text-kov-steel text-xs uppercase tracking-widest mb-3">Recherches suggérées</p>
                        <ul className="space-y-1 mb-6">
                          {SUGGESTIONS.map((s, index) => (
                            <li key={s} style={staggerStyle(visible, index)}>
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

                        <p className="text-kov-steel text-xs uppercase tracking-widest mb-3">Raccourcis</p>
                        <div className="grid grid-cols-2 gap-2">
                          {QUICK_LINKS.map((link, index) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={closeSearch}
                              className="flex items-center justify-between gap-2 p-3 border text-kov-bone text-sm hover:border-kov-red hover:text-kov-red transition-colors"
                              style={{ ...staggerStyle(visible, SUGGESTIONS.length + index), borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                            >
                              {link.title}
                              <span>→</span>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop only — an idle text-only modal read as flat; a real
                    photo gives the search moment the same atmosphere as the
                    rest of the site instead of feeling like a bolted-on
                    utility overlay. */}
                <div className="hidden md:block relative w-72 shrink-0">
                  <Image src="/kov/menu/studio-industriel.jpg" alt="" aria-hidden="true" fill sizes="288px" className="object-cover" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0.25) 45%, rgba(10,10,10,0.15) 100%), linear-gradient(0deg, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0.1) 45%)",
                    }}
                  />
                  <div className="relative h-full flex flex-col justify-end p-6">
                    <Image src="/kov/brand/kov-wordmark-bone.png" alt="" aria-hidden="true" width={1116} height={209} className="h-5 w-auto mb-3 opacity-90" />
                    <p className="text-kov-concrete text-xs leading-relaxed">Studio digital — Bordeaux, France.</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>,
          document.body
        )}
    </>
  );
}
