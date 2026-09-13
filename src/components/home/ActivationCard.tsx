"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";

interface ActivationCardProps {
  number: string;
  title: string;
  body: string;
  /** Only card 4 ("Performance durable") actually passes this — the
   * others show just number/title/body/visual, matching the reference
   * spec (not every card has a checklist). */
  features?: string[];
  visual: ReactNode;
  /** True while this is the coverflow's current active card — a red
   * border/glow and a slightly bolder title instead of leaving every card
   * in the stack looking identical regardless of focus. */
  active?: boolean;
  /** A real destination for this card's topic (an /expertise pillar, the
   * work gallery, or /contact) — not every card has an obvious one, so
   * this stays optional rather than forcing a link where none makes sense. */
  href?: string;
}

// A 9:16 card — number, title, body, one themed visual area (chart, the
// real Responsive video, or a photo), layered "glass" depth (top
// highlight + a cursor-reactive sheen, same recipe as the homepage hero's
// WidgetShell) instead of a flat rgba fill. Real navigation via `href`
// when the topic has an obvious destination, so the card is an actual
// entry point into the site, not just decoration.
//
// The cursor-sheen tracks pointer position via a CSS custom property set
// directly on the DOM node (no React state/re-render per mousemove) —
// same technique WidgetShell.tsx uses, for the same performance reason:
// up to 5-6 of these can be mounted simultaneously in the coverflow.
export function ActivationCard({ number, title, body, features, visual, active = false, href }: ActivationCardProps) {
  const shellRef = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    shellRef.current!.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    shellRef.current!.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }

  const inner = (
    <div
      ref={shellRef}
      onMouseMove={handlePointerMove}
      className="group relative w-full h-full overflow-hidden flex flex-col transition-[border-color,box-shadow] duration-300"
      style={{
        borderRadius: 20,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: `1px solid ${active ? "rgba(227,30,36,0.45)" : "var(--glass-border)"}`,
        boxShadow: active ? "var(--glass-shadow-full), 0 0 44px -8px rgba(227,30,36,0.35)" : "var(--glass-shadow-full)",
      }}
    >
      {/* Top highlight — a hairline of light along the upper edge. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: 20, background: "linear-gradient(to bottom, rgba(255,255,255,0.05), transparent 40%)" }}
      />
      {/* Cursor-reactive sheen, hover-only. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          borderRadius: 20,
          background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.06), transparent 55%)",
        }}
      />

      <div className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center">{visual}</div>

      <div className="relative p-5 shrink-0 text-left">
        <div className="flex items-center justify-between mb-2">
          <p className="font-mono text-xs transition-colors duration-300" style={{ color: active ? "var(--kov-red)" : "var(--kov-steel)" }}>
            {number}
          </p>
          {active && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />}
        </div>
        <p className="text-kov-bone text-base uppercase tracking-wide mb-2">{title}</p>
        <p className="text-kov-steel text-xs leading-relaxed">{body}</p>

        {features && features.length > 0 && (
          <ul className="space-y-1.5 mt-4 pt-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-[11px] text-kov-concrete">
                <span aria-hidden="true" className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--kov-red)" }} />
                {feature}
              </li>
            ))}
          </ul>
        )}

        {href && (
          <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-kov-red opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            En savoir plus
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block w-full h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}
