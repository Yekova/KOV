"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion, LIQUID_EASE } from "@/lib/motion";
import { SITE_SECTIONS } from "@/data/siteSections";

// Full-screen "whole site in one glance" overview, opened from
// GlobalMenuButton (bottom-center). Reuses GlobalSearch's own circular
// clip-path reveal (same mechanism, anchored at the button's fixed position
// instead of a measured trigger rect, since both are already bottom-center).
// A bento grid, not a plain link list — everything visible at once with no
// scroll is what actually reads as "one glance," and it echoes the 9-dot
// grid icon that opens it. GlassCard's interactive spotlight ties it into
// the same hover language WorkGallery's project cards already use.
export function GlobalOverviewMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  // Reset adjusted during render (React's documented pattern), not in an
  // effect — same idiom Nav.tsx uses for its own route-change reset. Only
  // the deferred "reveal" (via rAF) is a genuine side effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setVisible(false);
  }

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (typeof document === "undefined" || !open) return null;

  const anchorX = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
  const anchorY = typeof window !== "undefined" ? window.innerHeight - 48 : 0;
  const radius = typeof window !== "undefined" ? Math.hypot(window.innerWidth, window.innerHeight) : 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu du site"
      className="fixed inset-0 flex items-center justify-center px-6 py-24 overflow-y-auto"
      style={{
        zIndex: "var(--z-modal)",
        background: "rgba(10, 10, 10, 0.92)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
        clipPath: `circle(${visible ? radius : 0}px at ${anchorX}px ${anchorY}px)`,
        transition: `clip-path ${motion.slow}s ${LIQUID_EASE}`,
      }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="fixed top-6 right-6 text-kov-bone text-2xl leading-none hover:text-kov-red transition-colors"
      >
        ✕
      </button>

      <div
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        {SITE_SECTIONS.map((section, index) => (
          <Link key={section.href} href={section.href} onClick={onClose} className={`block ${section.span}`}>
            <GlassCard interactive className="h-full min-h-[160px] p-6 flex flex-col justify-end">
              <span className="text-kov-red font-mono text-xs mb-3">{String(index + 1).padStart(2, "0")}</span>
              <span
                className="font-display text-kov-bone uppercase"
                style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
              >
                {section.label}
              </span>
              <span className="text-kov-steel text-sm mt-2">{section.description}</span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>,
    document.body
  );
}
