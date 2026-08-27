"use client";

import { useEffect, useState } from "react";

interface KovSectionIndicatorProps {
  sections: { id: string; label: string }[];
}

// A discreet "02 / Projets" readout, fixed to the left edge — gives a scroll
// position landmark without turning the homepage into a navigation
// interface (see the brief's §17: "un repère sans transformer le site en
// interface de navigation classique"). Desktop-only (lg:) — on narrower
// viewports the horizontal space this would cost isn't worth a landmark
// most mobile users don't need while thumb-scrolling.
//
// Uses a shrunk-viewport IntersectionObserver (a thin band at the vertical
// center) rather than a per-pixel scroll listener — cheaper, and it's the
// standard technique for "which section is currently centered" tracking.
export function KovSectionIndicator({ sections }: KovSectionIndicatorProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sections.findIndex((section) => section.id === entry.target.id);
          if (index !== -1) setActiveIndex(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (activeIndex === null) return null;

  const current = sections[activeIndex];

  return (
    <div
      className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 items-center gap-2 px-3 py-2 border text-[10px] uppercase tracking-widest text-kov-steel transition-opacity duration-500"
      style={{
        zIndex: "var(--z-nav)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-pill)",
      }}
    >
      <span className="text-kov-red font-mono">{String(activeIndex + 1).padStart(2, "0")}</span>
      <span className="text-kov-muted">/</span>
      <span>{current.label}</span>
    </div>
  );
}
