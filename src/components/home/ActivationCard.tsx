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
const RADIUS = 22;
const PADDING = 18;

// The card is a light, frosted panel on a dark field — the fintech-UI
// treatment in the supplied reference, not the dark glass it used to be.
//
// It is done by re-pointing the design tokens on this one subtree rather
// than by restyling anything inside it. globals.css declares the palette
// with `@theme inline`, so `text-kov-bone` compiles to `color:
// var(--kov-bone)` rather than to a baked hex — which means redefining
// those variables here cascades into every descendant, including the six
// SVG chart components, which draw themselves entirely in
// var(--kov-bone) / var(--kov-steel) / var(--glass-border). Not one line
// of ActivationCharts.tsx had to change for the charts to invert with the
// surface they sit on.
//
// --kov-red is deliberately left alone: it is legible on both grounds and
// it is the single accent on this page.
const LIGHT_SURFACE_TOKENS = {
  "--kov-bone": "#15181b",
  "--kov-steel": "#6e7276",
  "--kov-concrete": "#4c5055",
  "--glass-border": "rgba(21,24,27,0.10)",
} as React.CSSProperties;
// Swiss-minimal convention, and the one this codebase already follows for
// state changes: fast enough to feel immediate, slow enough to be read.
const TRANSITION_MS = 220;

interface ActivationCardProps {
  number: string;
  /** How many cards there are in all — the chip beside the number shows
   * the position in the sequence, which is real information here: these six
   * are the stages of an approach and are read in order. */
  total: number;
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
export function ActivationCard({ number, total, title, body, features, visual, active = false, href }: ActivationCardProps) {
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
        ...LIGHT_SURFACE_TOKENS,
        borderRadius: RADIUS,
        // Genuinely translucent — this was the mistake in the opaque
        // version. Frosted glass is not a white panel: you have to see the
        // colour behind it move. At 0.30 the field reads through clearly
        // and the blur below is what turns it into glass rather than a
        // window. Only the shell carries backdrop-filter; everything
        // nested inside uses plain translucent fills, which look identical
        // over an already-blurred parent and cost nothing.
        background:
          "linear-gradient(150deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.26) 44%, rgba(255,255,255,0.34) 100%)",
        backdropFilter: "blur(26px) saturate(165%)",
        WebkitBackdropFilter: "blur(26px) saturate(165%)",
        // The rim is light, not dark: on a pale panel a dark outline reads
        // as a drawn box, while a white rim reads as a lit edge.
        border: `1px solid ${active ? "rgba(227,30,36,0.45)" : "rgba(255,255,255,0.55)"}`,
        // Four jobs at once: a bright top rim and a faint bottom one so the
        // pane has thickness, a tight contact shadow that sets the card
        // down, and a wide ambient one that gives it air.
        boxShadow: active
          ? "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.28), 0 12px 24px -12px rgba(46,20,26,0.4), 0 44px 72px -34px rgba(46,20,26,0.6)"
          : "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(255,255,255,0.2), 0 10px 18px -12px rgba(46,20,26,0.32), 0 32px 56px -32px rgba(46,20,26,0.48)",
        transitionDuration: `${TRANSITION_MS}ms`,
      }}
    >
      {/* The diagonal sheen every pane of glass in the reference carries —
          light catching the upper-left corner and falling away. Without it
          a translucent rectangle reads as a hole, not as a surface. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: RADIUS,
          background:
            "linear-gradient(142deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 26%, transparent 52%)",
        }}
      />
      {/* Cursor-reactive specular. On the old dark panel this was a faint
          white wash; on a pale one it has to be near-opaque white to show
          at all, which is also what it looks like on real frosted glass —
          a bright spot that follows the light. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity ease-out"
        style={{
          borderRadius: RADIUS,
          background: "radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.85), transparent 52%)",
          transitionDuration: `${TRANSITION_MS}ms`,
        }}
      />

      {/* Header plate — the number as a chip rather than as loose type,
          which is how the reference labels every one of its panels, and the
          position in the sequence beside it. */}
      <div
        className="relative flex items-center justify-between shrink-0"
        style={{ padding: PADDING, paddingBottom: 0 }}
      >
        <span
          className="flex items-center justify-center font-mono transition-colors ease-out"
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            fontSize: TYPE.label,
            letterSpacing: "0.08em",
            fontVariantNumeric: "tabular-nums",
            color: active ? "var(--kov-white)" : "var(--kov-bone)",
            background: active ? "var(--kov-red)" : "rgba(255,255,255,0.4)",
            border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.6)"}`,
            boxShadow: active
              ? "0 6px 14px -6px rgba(227,30,36,0.7)"
              : "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 10px -6px rgba(46,20,26,0.35)",
            transitionDuration: `${TRANSITION_MS}ms`,
          }}
        >
          {number}
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: TYPE.label,
            letterSpacing: "0.14em",
            fontVariantNumeric: "tabular-nums",
            color: "var(--kov-steel)",
          }}
        >
          {number} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* The visual sits in its own recessed pane instead of floating on
          the card. That nesting — a panel inside a panel, each with its own
          rim — is most of what gives the reference its depth, and most of
          what the flat version was missing. */}
      <div
        className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center"
        style={{
          margin: PADDING,
          marginBottom: 0,
          borderRadius: RADIUS - 8,
          background: "linear-gradient(160deg, rgba(255,255,255,0.34), rgba(255,255,255,0.14))",
          border: "1px solid rgba(255,255,255,0.45)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -10px 24px -18px rgba(46,20,26,0.5)",
        }}
      >
        {visual}
      </div>

      <div className="relative shrink-0 text-left" style={{ padding: PADDING }}>
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

        {/* A real pill, and always visible. As a hover-only line of text it
            was both invisible on the five cards you aren't pointing at and
            one less surface on a card that needed more of them. */}
        {href && (
          <span
            className="inline-flex items-center gap-2 uppercase transition-colors ease-out"
            style={{
              marginTop: PADDING,
              padding: "7px 12px",
              borderRadius: 999,
              fontSize: TYPE.caption,
              letterSpacing: "0.14em",
              color: "var(--kov-bone)",
              background: "rgba(255,255,255,0.42)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px -8px rgba(46,20,26,0.4)",
              transitionDuration: `${TRANSITION_MS}ms`,
            }}
          >
            En savoir plus
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--kov-red)"
              strokeWidth="2.5"
              className="transition-transform group-hover:translate-x-0.5"
            >
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
