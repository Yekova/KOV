"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, LIQUID_EASE } from "@/lib/motion";
import { ImmersiveMenuList } from "@/components/layout/ImmersiveMenuList";

const DOT_POSITIONS = [4, 12, 20];

// Quick actions, distinct from the 5 sections in ImmersiveMenuList — real
// destinations only (no fabricated "Ressources"/"Paramètres" pages).
const QUICK_LINKS = [
  {
    href: "/#work-gallery",
    label: "Projets",
    description: "Voir tous les projets",
    icon: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  },
  {
    href: "/faq",
    label: "FAQ",
    description: "Questions fréquentes",
    icon: (
      <>
        <path d="M12 17h.01" />
        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
  {
    href: "/login",
    label: "Espace client",
    description: "Mon compte",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
      </>
    ),
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Démarrer un projet",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
];

const GLASS_PANEL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
  boxShadow: "var(--glass-shadow-full)",
} as const;

// Full-screen "whole site in one glance" overview, opened from
// GlobalMenuButton (bottom-center). Reuses GlobalSearch's own circular
// clip-path reveal (same mechanism, anchored at the button's fixed position
// instead of a measured trigger rect, since both are already bottom-center).
//
// The centerpiece is ImmersiveMenuList — a full-width row per section, each
// revealing a sliding red marquee panel on hover (adapted from reactbits.dev's
// FlowingMenu). Replaces an earlier orbital-diagram version: connecting
// lines between small circular nodes read as "not well connected" once
// actually in front of the user, and a full-bleed reveal-on-hover list is
// both a more common "immersive site menu" pattern and sidesteps needing
// per-section photoreal imagery that doesn't exist for 4 of the 5 sections.
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
      aria-label="Menu global"
      className="fixed inset-0 overflow-y-auto"
      style={{
        zIndex: "var(--z-modal)",
        background: "rgba(10, 10, 10, 0.96)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
        clipPath: `circle(${visible ? radius : 0}px at ${anchorX}px ${anchorY}px)`,
        transition: `clip-path ${motion.slow}s ${LIQUID_EASE}`,
      }}
      onClick={onClose}
    >
      <div className="min-h-full px-6 md:px-12 py-8 flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <Image src="/kov/brand/kov-wordmark-bone.png" alt="KOV" width={1116} height={209} className="h-5 w-auto" />
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-3 text-kov-bone hover:text-kov-red transition-colors"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ✕
            </span>
            <span className="text-xs uppercase tracking-widest">Fermer le menu</span>
            <span
              className="hidden sm:inline text-[10px] uppercase tracking-widest border px-2 py-1"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              Échap
            </span>
          </button>
        </div>

        <div className="mt-8 md:mt-10">
          <div className="flex items-center gap-2">
            <p
              className="font-display text-kov-bone uppercase"
              style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
            >
              Menu global
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-kov-red shrink-0" />
          </div>
          <p className="mt-3 max-w-md text-kov-steel text-sm leading-relaxed">
            Accédez à l&apos;ensemble de nos univers en un clin d&apos;œil.
          </p>
        </div>

        <div className="mt-8 md:mt-10 flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12 items-start">
          <ImmersiveMenuList onNavigate={onClose} />

          <div className="border p-6" style={{ ...GLASS_PANEL_STYLE, borderRadius: "var(--radius-glass)" }}>
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-5">Accès rapides</p>
            <ul className="space-y-5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={onClose} className="flex items-start gap-3 group">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-kov-steel group-hover:text-kov-red transition-colors mt-0.5 shrink-0"
                    >
                      {link.icon}
                    </svg>
                    <span>
                      <span className="block text-kov-bone text-sm uppercase tracking-wide group-hover:text-kov-red transition-colors">
                        {link.label}
                      </span>
                      <span className="block text-kov-steel text-xs mt-0.5">{link.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-end gap-8">
          <div className="flex items-end gap-4">
            <Image
              src="/kov/character/menu-character-transparent.png"
              alt=""
              aria-hidden="true"
              width={624}
              height={1007}
              className="h-28 md:h-36 w-auto shrink-0"
            />
            <div className="border p-4 max-w-xs" style={{ ...GLASS_PANEL_STYLE, borderRadius: "var(--radius-glass)" }}>
              <p className="font-display text-kov-bone uppercase text-sm">Besoin d&apos;aide ?</p>
              <p className="text-kov-steel text-xs mt-1">Notre équipe est là pour vous accompagner.</p>
              <Link
                href="/contact"
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1 text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors"
              >
                Contacter KOV →
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-3 px-5 py-3 border text-kov-bone hover:text-kov-red transition-colors self-center justify-self-center"
            style={{ ...GLASS_PANEL_STYLE, borderRadius: "var(--radius-pill)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              {DOT_POSITIONS.flatMap((cy) => DOT_POSITIONS.map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />))}
            </svg>
            <span className="text-xs uppercase tracking-widest">Retour au bureau</span>
          </button>

          <div />
        </div>
      </div>
    </div>,
    document.body
  );
}
