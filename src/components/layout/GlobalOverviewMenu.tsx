"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, LIQUID_EASE } from "@/lib/motion";
import { SITE_SECTIONS } from "@/data/siteSections";

const DOT_POSITIONS = [4, 12, 20];

// Quick actions, distinct from the 5 orbital sections above — real
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

// One hand-drawn icon per section — same stroke-icon convention as the rest
// of the site (Nav, GlobalSearch), and sidesteps needing a photoreal render
// per section: an icon that animates on hover reads as intentional design,
// not a placeholder the way an unfinished photo would.
const SECTION_ICONS: Record<string, ReactNode> = {
  "/": (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </>
  ),
  "/expertise": (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  "/studio": (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 8h.01M9 12h.01M9 16h.01M15 8h.01M15 12h.01M15 16h.01" />
    </>
  ),
  "/journal": (
    <>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </>
  ),
  "/contact": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
};

// 5 evenly spaced points around a circle, starting from the top, in a 0-100
// viewBox/percentage space shared by both the SVG connector lines and the
// absolutely-positioned HTML node tiles.
const ORBIT_RADIUS = 40;
const ORBIT_NODES = SITE_SECTIONS.map((section, index) => {
  const angle = (-90 + (index * 360) / SITE_SECTIONS.length) * (Math.PI / 180);
  return {
    ...section,
    x: 50 + ORBIT_RADIUS * Math.cos(angle),
    y: 50 + ORBIT_RADIUS * Math.sin(angle),
  };
});

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
// An orbital diagram (5 real sections around a center KOV mark) instead of a
// plain link list. Each node is a hand-drawn icon rather than a photo — an
// icon that animates on hover reads as intentional design; a photoreal
// render would need either a matching real asset (only Accueil ever had
// one) or spending real Kling generation credits, which isn't done without
// the user confirming exact prompts first.
export function GlobalOverviewMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

        <div className="mt-10 md:mt-16 flex-1 grid grid-cols-1 lg:grid-cols-[240px_1fr_260px] gap-12 items-start">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-kov-bone uppercase" style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}>
                Menu global
              </p>
              <span className="w-1.5 h-1.5 rounded-full bg-kov-red shrink-0" />
            </div>
            <p className="mt-4 max-w-[220px] text-kov-steel text-sm leading-relaxed">
              Accédez à l&apos;ensemble de nos univers en un clin d&apos;œil.
            </p>
          </div>

          <div className="relative w-full max-w-[560px] mx-auto aspect-square">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r={ORBIT_RADIUS}
                fill="none"
                stroke="var(--kov-border)"
                strokeWidth="0.3"
                strokeDasharray="0.6 1.4"
              />
              {ORBIT_NODES.map((node, index) => (
                <line
                  key={node.href}
                  x1="50"
                  y1="50"
                  x2={node.x}
                  y2={node.y}
                  stroke="var(--kov-red)"
                  strokeOpacity={hoveredIndex === index ? 0.9 : 0.35}
                  strokeWidth={hoveredIndex === index ? 0.6 : 0.3}
                  strokeDasharray="0.6 1.4"
                  style={{ transition: "stroke-opacity 0.3s ease, stroke-width 0.3s ease" }}
                />
              ))}
            </svg>

            <div
              className="absolute w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.18), rgba(227,30,36,0.9) 55%, rgba(10,10,10,0.9) 100%)",
                boxShadow: "0 0 40px rgba(227,30,36,0.55)",
              }}
            >
              <span className="font-display text-kov-white text-sm tracking-widest">KOV</span>
            </div>

            {ORBIT_NODES.map((node, index) => (
              <Link
                key={node.href}
                href={node.href}
                onClick={onClose}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
                className="absolute flex flex-col items-center gap-2 w-28 group"
                style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-500 group-hover:-translate-y-1"
                  style={{
                    borderColor: hoveredIndex === index ? "var(--kov-red)" : "var(--glass-border)",
                    background: "linear-gradient(160deg, var(--kov-graphite), var(--kov-carbon))",
                    boxShadow: hoveredIndex === index ? "0 0 24px rgba(227,30,36,0.45)" : "var(--glass-shadow-full)",
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="transition-all duration-500"
                    style={{
                      color: hoveredIndex === index ? "var(--kov-red)" : "var(--kov-steel)",
                      transform: hoveredIndex === index ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    {SECTION_ICONS[node.href]}
                  </svg>
                </div>
                <div className="text-center">
                  <span className="text-kov-red font-mono text-[10px]">{String(index + 1).padStart(2, "0")}</span>
                  <p className="font-display text-kov-bone uppercase text-sm group-hover:text-kov-red transition-colors">
                    {node.label}
                  </p>
                  <p className="text-kov-steel text-[11px] leading-snug hidden md:block">{node.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="border rounded-none p-6" style={{ ...GLASS_PANEL_STYLE, borderRadius: "var(--radius-glass)" }}>
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
