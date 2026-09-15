"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";

// One scale for the whole card, four steps, nothing off it. The previous
// version drew on seven arbitrary sizes between 10px and 16px, which is
// what made it read as approximate up close: hierarchy you can feel comes
// from few, decided sizes rather than many near-identical ones.
const TYPE = {
  label: 11,
  caption: 12,
  body: 13,
  title: 15,
} as const;

// Radius and padding are the same number so the inner edges stay
// concentric with the outer corner instead of drifting apart at the bend.
const RADIUS = 18;
const PADDING = 18;
// Swiss-minimal convention, and the one this codebase already follows for
// state changes: fast enough to feel immediate, slow enough to be read.
const TRANSITION_MS = 220;

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

// A 9:16 card — number, title, body, and one themed visual area above a
// ruled copy block. Real navigation via `href` when the topic has an
// obvious destination, so the card is an actual entry point into the site,
// not just decoration.
//
// The number is not ornament: these six are the stages of an approach and
// they are read in order, so the sequence is information and earns a slot.
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
      className="group relative w-full h-full overflow-hidden flex flex-col transition-[border-color,box-shadow] ease-out"
      style={{
        borderRadius: RADIUS,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: `1px solid ${active ? "var(--kov-red)" : "var(--glass-border)"}`,
        // A sharp elevation shadow and a hairline of light along the top
        // edge — the latter replacing a separate gradient layer that was
        // drawing the same edge more softly and less exactly. Elevation is
        // achromatic on purpose: the active card used to carry a 44px red
        // bloom, which is a blurred, imprecise way to say something the
        // border and the accent rule below now say with an edge.
        boxShadow: active
          ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 20px 44px -16px rgba(0,0,0,0.75)"
          : "inset 0 1px 0 rgba(255,255,255,0.05), 0 12px 28px -18px rgba(0,0,0,0.6)",
        transitionDuration: `${TRANSITION_MS}ms`,
      }}
    >
      {/* Cursor-reactive sheen, hover only. The one soft effect kept, at
          half its previous strength: with the top highlight now drawn by a
          crisp inset shadow, this no longer has to compete with a second
          overlay for the same surface. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity ease-out"
        style={{
          borderRadius: RADIUS,
          background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.05), transparent 55%)",
          transitionDuration: `${TRANSITION_MS}ms`,
        }}
      />

      <div className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center">{visual}</div>

      {/* The visual and the copy are two zones of one card, so they get a
          real edge between them rather than floating apart on whitespace.
          When the card is active that edge carries the accent — a 2px rule
          laid over the hairline, so nothing shifts by a pixel as it turns
          on. */}
      <div
        className="relative shrink-0 text-left"
        style={{ padding: PADDING, borderTop: "1px solid var(--glass-border)" }}
      >
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 transition-opacity ease-out"
          style={{
            top: -1,
            height: 2,
            background: "var(--kov-red)",
            opacity: active ? 1 : 0,
            transitionDuration: `${TRANSITION_MS}ms`,
          }}
        />

        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <p
            className="font-mono transition-colors ease-out"
            style={{
              fontSize: TYPE.label,
              letterSpacing: "0.14em",
              // Tabular figures so 01 through 06 occupy the same width and
              // the titles under them start on the same optical line from
              // card to card.
              fontVariantNumeric: "tabular-nums",
              color: active ? "var(--kov-red)" : "var(--kov-steel)",
              transitionDuration: `${TRANSITION_MS}ms`,
            }}
          >
            {number}
          </p>
          {active && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />}
        </div>

        <p
          className="text-kov-bone uppercase"
          style={{ fontSize: TYPE.title, letterSpacing: "0.045em", lineHeight: 1.25, marginBottom: 8 }}
        >
          {title}
        </p>
        <p className="text-kov-steel" style={{ fontSize: TYPE.body, lineHeight: 1.55 }}>
          {body}
        </p>

        {features && features.length > 0 && (
          <ul
            className="space-y-1.5"
            style={{ marginTop: PADDING, paddingTop: PADDING, borderTop: "1px solid var(--glass-border)" }}
          >
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-kov-concrete"
                style={{ fontSize: TYPE.caption }}
              >
                <span aria-hidden="true" className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--kov-red)" }} />
                {feature}
              </li>
            ))}
          </ul>
        )}

        {href && (
          <span
            className="inline-flex items-center gap-1.5 uppercase text-kov-red opacity-0 group-hover:opacity-100 transition-opacity ease-out"
            style={{
              marginTop: PADDING,
              fontSize: TYPE.caption,
              letterSpacing: "0.16em",
              transitionDuration: `${TRANSITION_MS}ms`,
            }}
          >
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
