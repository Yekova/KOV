"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DEFAULT_HERO_WIDGET_ORDER,
  HERO_WIDGET_LAYOUT_STORAGE_KEY,
  HERO_WIDGET_HINT_SEEN_STORAGE_KEY,
  HERO_WIDGET_SIZE,
  MOBILE_HERO_WIDGET_ORDER,
  type HeroWidgetId,
} from "@/data/heroWidgets";
import { prefersReducedMotion } from "@/lib/motion";
import { WidgetShell, DragHandle } from "@/components/home/hero-widgets/WidgetShell";
import { ProjectSpotlightContent } from "@/components/home/hero-widgets/ProjectSpotlightContent";
import { ResponsivePreviewContent } from "@/components/home/hero-widgets/ResponsivePreviewContent";
import { PerformanceContent } from "@/components/home/hero-widgets/PerformanceContent";
import { Studio360Content } from "@/components/home/hero-widgets/Studio360Content";
import { ExpertiseSwitcherContent } from "@/components/home/hero-widgets/ExpertiseSwitcherContent";
import { JournalContent, type HeroJournalPost } from "@/components/home/hero-widgets/JournalContent";
import { StartProjectContent } from "@/components/home/hero-widgets/StartProjectContent";

// Returns null when there's nothing usable stored — the caller keeps
// whatever it already had (the default order) rather than this function
// re-deciding that fallback itself.
function readStoredOrder(): HeroWidgetId[] | null {
  try {
    const raw = window.localStorage.getItem(HERO_WIDGET_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const valid =
      Array.isArray(parsed) &&
      parsed.length === DEFAULT_HERO_WIDGET_ORDER.length &&
      DEFAULT_HERO_WIDGET_ORDER.every((id) => parsed.includes(id));
    return valid ? (parsed as HeroWidgetId[]) : null;
  } catch {
    return null;
  }
}

function readHintSeen(): boolean {
  try {
    return window.localStorage.getItem(HERO_WIDGET_HINT_SEEN_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function HeroWidgetGrid({ latestPost }: { latestPost: HeroJournalPost | null }) {
  // The order/hint state below both start at their SSR-safe defaults —
  // reading localStorage straight into a useState lazy initializer would
  // make the client's *first* render (during hydration) differ from the
  // server-rendered HTML, since `window` only exists client-side. That's
  // fine for a boolean like `reducedMotion` (framer-motion already
  // reconciles `initial`/`animate` props safely across SSR), but `order`
  // directly drives which DOM element renders in which grid slot — a real
  // hydration mismatch, not just a cosmetic one. So both are applied via
  // the effect below instead, which only ever runs after hydration
  // completes; a saved layout swaps in a frame or two after first paint
  // rather than mismatching the server's HTML.
  const [order, setOrder] = useState<HeroWidgetId[]>(DEFAULT_HERO_WIDGET_ORDER);
  const [reducedMotion] = useState(() => prefersReducedMotion());
  const [showHint, setShowHint] = useState(false);
  const [draggedId, setDraggedId] = useState<HeroWidgetId | null>(null);
  const [dropTargetId, setDropTargetId] = useState<HeroWidgetId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // State, not a ref: the `draggable` attribute below has to flip to true
  // *before* the browser's native drag-start gesture is recognized, which
  // means it needs an actual re-render — a ref mutation alone wouldn't
  // update the DOM attribute in time.
  const [armedId, setArmedId] = useState<HeroWidgetId | null>(null);

  useEffect(() => {
    // Deferred via setTimeout rather than called straight in the effect
    // body — same pattern as the hint auto-dismiss effect just below,
    // which this mirrors specifically to read as "reacting to an external
    // system in a callback" rather than a synchronous derived-state update.
    const id = window.setTimeout(() => {
      const stored = readStoredOrder();
      if (stored) setOrder(stored);
      if (!readHintSeen()) setShowHint(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const id = window.setTimeout(() => {
      setShowHint(false);
      try {
        window.localStorage.setItem(HERO_WIDGET_HINT_SEEN_STORAGE_KEY, "1");
      } catch {
        // localStorage can throw in private-browsing/blocked-storage
        // contexts — the hint just won't be remembered, nothing else
        // depends on this write succeeding.
      }
    }, 3000);
    return () => window.clearTimeout(id);
  }, [showHint]);

  function persistOrder(next: HeroWidgetId[]) {
    setOrder(next);
    try {
      window.localStorage.setItem(HERO_WIDGET_LAYOUT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Same as above — persistence is a nice-to-have, not load-bearing.
    }
  }

  function handleDrop(targetId: HeroWidgetId) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }
    const next = [...order];
    const fromIndex = next.indexOf(draggedId);
    const toIndex = next.indexOf(targetId);
    // A straight swap (not an insert-and-shift) — every widget keeps its
    // own fixed size regardless of where it lands, so swapping array
    // positions is well-defined no matter how differently the two
    // widgets are shaped; `grid-flow-row-dense` below repacks around it.
    [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
    persistOrder(next);
    setDraggedId(null);
    setDropTargetId(null);
  }

  function resetLayout() {
    persistOrder(DEFAULT_HERO_WIDGET_ORDER);
    setMenuOpen(false);
  }

  const content: Record<HeroWidgetId, React.ReactNode> = {
    spotlight: <ProjectSpotlightContent />,
    responsive: <ResponsivePreviewContent />,
    performance: <PerformanceContent />,
    studio: <Studio360Content />,
    expertise: <ExpertiseSwitcherContent />,
    journal: <JournalContent post={latestPost} />,
    "start-project": <StartProjectContent />,
  };

  return (
    <div className="relative w-full">
      {/* Radial gradient behind the grid for legibility (spec §15) —
          strictly local to this component, not a new page-wide
          background: the sitewide LineWaves canvas (src/app/page.tsx)
          is untouched. */}
      <div
        aria-hidden="true"
        className="absolute -inset-8 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.35) 100%)" }}
      />

      {/* Desktop/tablet: the draggable dense grid. Hidden below md rather
          than gated by a JS media-query check, so there's no
          client/server hydration mismatch. */}
      <div className="relative hidden md:grid grid-cols-4 grid-flow-row-dense gap-3" style={{ height: "34rem" }}>
        {order.map((id, i) => (
          <motion.div
            key={id}
            layout={!reducedMotion}
            initial={reducedMotion ? false : { opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              layout: { duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.4, delay: reducedMotion ? 0 : i * 0.08 },
              y: { duration: 0.4, delay: reducedMotion ? 0 : i * 0.08 },
              scale: { duration: 0.4, delay: reducedMotion ? 0 : i * 0.08 },
            }}
            className={HERO_WIDGET_SIZE[id]}
          >
            <WidgetShell
              draggable={armedId === id}
              isDragging={draggedId === id}
              isDropTarget={dropTargetId === id}
              onDragStart={() => setDraggedId(id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDropTargetId(null);
                setArmedId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedId && draggedId !== id) setDropTargetId(id);
              }}
              onDrop={() => handleDrop(id)}
            >
              <DragHandle onPointerDown={() => setArmedId(id)} onPointerUp={() => setArmedId(null)} />
              {content[id]}
            </WidgetShell>
          </motion.div>
        ))}

        {showHint && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 20 }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2 text-kov-bone text-xs uppercase tracking-widest"
              style={{ borderRadius: 999, background: "rgba(10,10,10,0.8)", border: "1px solid rgba(255,255,255,0.14)" }}
            >
              <span>⠿</span>
              Déplacez les modules
            </div>
          </div>
        )}

        <div className="absolute -top-10 right-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Options de disposition"
            className="w-7 h-7 flex items-center justify-center rounded-full text-kov-steel hover:text-kov-bone transition-colors text-xs"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}
          >
            •••
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 py-1 text-xs whitespace-nowrap"
              style={{ borderRadius: 12, background: "rgba(10,10,10,0.9)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <button type="button" onClick={resetLayout} className="block w-full px-4 py-2 text-left text-kov-steel hover:text-kov-red transition-colors">
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: fixed editorial order (spec §23), no drag at all. */}
      <div className="md:hidden flex flex-col gap-3">
        <div className="relative" style={{ aspectRatio: "3 / 4" }}>
          <WidgetShell draggable={false} isDragging={false} isDropTarget={false} onDragStart={() => {}} onDragEnd={() => {}} onDragOver={() => {}} onDrop={() => {}}>
            {content.responsive}
          </WidgetShell>
        </div>
        {MOBILE_HERO_WIDGET_ORDER.filter((id) => id !== "responsive").map((id) => (
          <div key={id} className="relative" style={{ aspectRatio: id === "spotlight" ? "4 / 3" : "16 / 9" }}>
            <WidgetShell draggable={false} isDragging={false} isDropTarget={false} onDragStart={() => {}} onDragEnd={() => {}} onDragOver={() => {}} onDrop={() => {}}>
              {content[id]}
            </WidgetShell>
          </div>
        ))}
      </div>
    </div>
  );
}
