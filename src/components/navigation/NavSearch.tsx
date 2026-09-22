"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchItem } from "@/data/searchIndex";
import { searchKov } from "@/lib/search";
import { NavDropdownPanel } from "@/components/navigation/NavDropdownPanel";
import { motion } from "@/lib/motion/timing";
import { REVEAL_EASE } from "@/lib/motion/easing";

const MAX_RESULTS = 6;
const PANEL_WIDTH = 460;

// Search, in the bar rather than over the page.
//
// This replaces a full-screen modal with categories, suggestion chips,
// shortcut tiles and a photograph — a room to be in rather than a field to
// type in. Searching a site this size is one question and a handful of
// answers, and the modal made a ceremony of it.
//
// The field unfurls to the left of the magnifier, absolutely positioned
// over the links. That is not a styling preference: the pill is a
// GlassSurface, which regenerates a real SVG displacement filter every time
// its box changes size, so a field that widened the pill would rebuild that
// filter on every frame of its own animation. Nothing here changes the
// pill's measured size.
export function NavSearch({
  pillRef,
  onOpenChange,
}: {
  pillRef: RefObject<HTMLDivElement | null>;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [anchorTop, setAnchorTop] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    onOpenChange(false);
  }, [onOpenChange]);

  const openField = useCallback(() => {
    const rect = pillRef.current?.getBoundingClientRect();
    if (rect) setAnchorTop(rect.bottom + 12);
    setOpen(true);
    onOpenChange(true);
    // After the state lands, so the input is not still width-zero and
    // clipped when the browser scrolls focus into view.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [onOpenChange, pillRef]);

  // Results. searchKov returns nothing for an empty query, so there is no
  // branch here that sets state synchronously — the whole effect is one
  // promise and its cancel flag.
  useEffect(() => {
    let cancelled = false;
    void searchKov(query, "Tout").then((items) => {
      if (!cancelled) setResults(items.slice(0, MAX_RESULTS));
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  // The shortcut the modal had, kept: it is the one thing about a site
  // search people already know without being told.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) close();
        else openField();
      }
      if (event.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, openField]);

  // Anywhere else on the page closes it. pointerdown rather than click, so
  // the field is gone before whatever was clicked reacts — and the panel
  // is portaled to <body>, so it has to be excluded by hand.
  useEffect(() => {
    if (!open) return;

    const onDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    // The pill's own padding changes as the page scrolls, so the anchor
    // moves with it rather than only being measured once on open.
    const reanchor = () => {
      const rect = pillRef.current?.getBoundingClientRect();
      if (rect) setAnchorTop(rect.bottom + 12);
    };

    document.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", reanchor);
    window.addEventListener("scroll", reanchor, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", reanchor);
      window.removeEventListener("scroll", reanchor);
    };
  }, [open, close, pillRef]);

  /** Down from the field walks into the answers; down and up walk through
   *  them; escape comes back. Real focus moves, rather than an
   *  aria-activedescendant index — the results are links, and a link the
   *  browser has focused is one the browser will open. */
  const step = (from: HTMLElement | null, delta: number) => {
    const links = Array.from(listRef.current?.querySelectorAll("a") ?? []);
    if (links.length === 0) return;
    const index = from ? links.indexOf(from as HTMLAnchorElement) : -1;
    links[Math.max(0, Math.min(links.length - 1, index + delta))]?.focus();
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className="relative flex items-center">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          const first = results[0];
          if (first) {
            router.push(first.href);
            close();
          }
        }}
        // Unfurls leftwards from the magnifier, over the links. Width and
        // opacity only, and the box it grows into is absolutely positioned,
        // so nothing around it moves.
        className={`absolute right-full top-1/2 mr-1.5 -translate-y-1/2 overflow-hidden ${
          open ? "w-[198px] lg:w-[264px] opacity-100" : "w-0 opacity-0"
        }`}
        style={{
          transitionProperty: "width, opacity",
          transitionDuration: `${motion.normal}s`,
          transitionTimingFunction: REVEAL_EASE,
        }}
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              step(null, 1);
            }
          }}
          placeholder="Rechercher"
          aria-label="Rechercher sur le site"
          // aria-controls, but deliberately not aria-expanded: that
          // property belongs to a combobox, and this is not one. The popup
          // is a list of links, not a listbox of options, so the honest
          // pattern is a search field with results announced below it —
          // see the status line in the panel.
          aria-controls="kov-nav-search-results"
          // -1 while closed: a zero-width field is still in the tab order
          // otherwise, and tabbing into something invisible is the worst
          // kind of keyboard trap.
          tabIndex={open ? 0 : -1}
          className="h-8 w-full rounded-full border px-4 text-xs text-kov-bone outline-none placeholder:text-kov-steel"
          style={{ background: "rgba(255,255,255,0.06)", borderColor: "var(--kov-border)" }}
        />
      </form>

      <button
        type="button"
        onClick={() => (open ? close() : openField())}
        aria-label={open ? "Fermer la recherche" : "Rechercher"}
        title={open ? "Fermer" : "Rechercher"}
        className="flex h-9 w-9 items-center justify-center text-kov-bone transition-colors hover:text-kov-red"
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        )}
      </button>

      <NavDropdownPanel
        visible={showPanel}
        anchorTop={anchorTop}
        width={PANEL_WIDTH}
        onMouseEnter={() => {}}
        onMouseLeave={() => {}}
      >
        <div ref={panelRef} className="p-3">
          {/* What a sighted visitor reads from the panel appearing. Polite,
              so it waits for a pause in typing rather than interrupting
              every keystroke. */}
          <p role="status" aria-live="polite" className="sr-only">
            {results.length === 0
              ? "Aucun résultat"
              : `${results.length} résultat${results.length > 1 ? "s" : ""}`}
          </p>
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-kov-steel">Aucun résultat pour “{query.trim()}”.</p>
          ) : (
            <ul ref={listRef} id="kov-nav-search-results" className="flex flex-col">
              {results.map((item) => (
                <li key={item.href + item.title}>
                  <Link
                    href={item.href}
                    onClick={close}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        step(event.currentTarget, 1);
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        step(event.currentTarget, -1);
                      }
                      if (event.key === "Escape") inputRef.current?.focus();
                    }}
                    className="flex items-baseline justify-between gap-4 rounded-[var(--radius-sm)] px-3 py-3 transition-colors hover:bg-white/[0.05]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-kov-bone">{item.title}</span>
                      <span className="mt-1 block truncate text-xs text-kov-steel">{item.description}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[9px] tracking-[0.2em] uppercase text-kov-steel">
                      {item.category}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </NavDropdownPanel>
    </div>
  );
}
