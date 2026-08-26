"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, LIQUID_EASE } from "@/lib/motion";
import { InfiniteMenu, type InfiniteMenuItem } from "@/components/layout/InfiniteMenu";
import { SITE_SECTIONS } from "@/data/siteSections";

const MENU_ITEMS: InfiniteMenuItem[] = SITE_SECTIONS.map((section) => ({
  image: section.image,
  link: section.href,
  title: section.label,
  description: section.description,
}));

// Quick actions, distinct from the 5 sections in InfiniteMenu — real
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
// The centerpiece is InfiniteMenu — a drag-to-rotate WebGL sphere of the 5
// site sections (reactbits.dev's free InfiniteMenu, ported in full). Third
// redesign of this menu: an orbital diagram of connected nodes read as "not
// well connected", and a full-width hover-reveal list (FlowingMenu-style)
// was rejected in turn for something more immersive. Textures come from
// SITE_SECTIONS' own `image` field — real, already-existing repo photography
// reused as atlas tiles, not fabricated per-section imagery.
//
// The sphere is full-bleed (fills the entire modal, not a boxed panel) with
// every other element — logo, heading, help panel, quick links — floating
// on top as an overlay. The overlay wrapper is pointer-events-none so a drag
// anywhere empty still rotates the sphere; only the actual interactive
// pieces re-enable pointer-events. Backdrop-click-to-close is gone along
// with it — once the sphere fills the whole screen there's no inert
// "backdrop" left to click, so Escape and the ✕ button are the close paths.
// The old bottom-center "Retour au bureau" pill was dropped rather than
// relocated: it would sit exactly where the sphere's own navigate button
// already lives, and it was already redundant with ✕ / Escape.
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
      className="fixed inset-0 overflow-hidden"
      style={{
        zIndex: "var(--z-modal)",
        background: "var(--kov-black)",
        clipPath: `circle(${visible ? radius : 0}px at ${anchorX}px ${anchorY}px)`,
        transition: `clip-path ${motion.slow}s ${LIQUID_EASE}`,
      }}
    >
      <div className="absolute inset-0">
        <InfiniteMenu items={MENU_ITEMS} scale={3} onNavigate={onClose} />
      </div>

      {/* Vignette so the corner-anchored UI below stays legible over
          whichever disc happens to be rotated underneath it, while leaving
          the center — where the sphere's own title/description sit — clear. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(10, 10, 10, 0.6) 90%)" }}
      />

      <div className="absolute inset-0 flex flex-col px-6 md:px-12 py-8 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
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

        <div className="mt-8 md:mt-10 pointer-events-auto w-fit">
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
            Accédez à l&apos;ensemble de nos univers en un clin d&apos;œil. Glissez la sphère pour naviguer.
          </p>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-end justify-between gap-8">
          <div className="flex items-end gap-4 pointer-events-auto">
            <Image
              src="/kov/character/menu-character-transparent.png"
              alt=""
              aria-hidden="true"
              width={624}
              height={1007}
              className="h-28 w-auto shrink-0"
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

          <div className="border p-6 w-64 shrink-0 pointer-events-auto" style={{ ...GLASS_PANEL_STYLE, borderRadius: "var(--radius-glass)" }}>
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Accès rapides</p>
            <ul className="space-y-4">
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
      </div>
    </div>,
    document.body
  );
}
