"use client";

import { useMemo, useRef, useState } from "react";
import { FAQ, FAQ_CATEGORIES, type FaqCategory } from "@/data/faq";
import { FaqAccordionItem } from "@/components/faq/FaqAccordionItem";
import { GridParallaxBackdrop } from "@/components/ui/GridParallaxBackdrop";
import { Reveal } from "@/components/ui/Reveal";

const ALL = "Tout" as const;
type CategoryFilter = FaqCategory | typeof ALL;

const GLASS_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
} as const;

// The real engine behind /faq: a search box + category filters over the
// FAQ data, not just a static accordion. Three display modes depending on
// filter state:
// - "Tout" + no query: grouped by category — the full picture, easiest
//   to scan when you don't know exactly what you're looking for yet.
// - a specific category selected: a flat list within that category.
// - an active search query: a flat list of matches across every
//   category (each item's own category shown as a small tag), the
//   standard search-result shape regardless of where the match lives.
export function FaqEngine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const q = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const map = new Map<FaqCategory, number>();
    for (const item of FAQ) map.set(item.category, (map.get(item.category) ?? 0) + 1);
    return map;
  }, []);

  const filtered = useMemo(() => {
    return FAQ.filter((item) => {
      if (category !== ALL && item.category !== category) return false;
      if (!q) return true;
      return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
    });
  }, [category, q]);

  const showGrouped = category === ALL && !q;

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {!reducedMotion && <GridParallaxBackdrop containerRef={containerRef} />}

      <div className="relative">
        <Reveal variant="blur" delay={0.15}>
          <div className="flex items-center gap-3 border-b pb-4 px-5 py-4 max-w-xl" style={{ ...GLASS_STYLE, borderRadius: "var(--radius-glass)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-kov-steel shrink-0">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Chercher une question — délais, budget, technique…"
              className="flex-1 bg-transparent text-kov-bone placeholder:text-kov-steel focus:outline-none text-sm"
            />
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              type="button"
              onClick={() => setCategory(ALL)}
              className="px-4 py-1.5 text-xs uppercase tracking-widest border transition-colors"
              style={{
                borderColor: category === ALL ? "var(--kov-red)" : "var(--kov-border)",
                color: category === ALL ? "var(--kov-red)" : "var(--kov-bone)",
                borderRadius: "var(--radius-pill)",
              }}
            >
              Tout ({FAQ.length})
            </button>
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="px-4 py-1.5 text-xs uppercase tracking-widest border transition-colors"
                style={{
                  borderColor: category === cat ? "var(--kov-red)" : "var(--kov-border)",
                  color: category === cat ? "var(--kov-red)" : "var(--kov-bone)",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                {cat} ({counts.get(cat) ?? 0})
              </button>
            ))}
          </div>
        </Reveal>

        <p className="mt-8 text-kov-steel text-xs uppercase tracking-widest">
          {filtered.length} question{filtered.length !== 1 ? "s" : ""}
        </p>

        <div className="mt-4 max-w-3xl">
          {filtered.length === 0 && (
            <p className="text-kov-steel text-sm py-12">Aucun résultat pour cette recherche — essayez un autre mot, ou contactez-nous directement.</p>
          )}

          {filtered.length > 0 && showGrouped && (
            <div className="space-y-16">
              {FAQ_CATEGORIES.map((cat) => {
                const items = FAQ.filter((item) => item.category === cat);
                return (
                  <Reveal key={cat} delay={0.05}>
                    <div>
                      <h2 className="text-kov-red font-mono text-xs uppercase tracking-widest mb-2">{cat}</h2>
                      <div className="border-t" style={{ borderColor: "var(--kov-border)" }}>
                        {items.map((item) => (
                          <FaqAccordionItem key={item.question} item={item} />
                        ))}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}

          {filtered.length > 0 && !showGrouped && (
            <Reveal>
              <div className="border-t" style={{ borderColor: "var(--kov-border)" }}>
                {filtered.map((item) => (
                  <FaqAccordionItem key={item.question} item={item} />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}
