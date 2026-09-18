"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import "./ActivationCard.css";

// The card re-points the palette tokens on its own subtree rather than
// restyling what sits inside it. globals.css declares the palette with
// `@theme inline`, so `text-kov-bone` compiles to `color: var(--kov-bone)`
// rather than a baked hex — which means redefining these here cascades all
// the way down, including into the six SVG visuals, which draw themselves
// entirely in var(--kov-bone) / var(--kov-steel) / var(--glass-border).
// Not a line of ActivationCharts.tsx has to change for them to sit
// correctly on an off-white surface.
//
// --kov-red is deliberately untouched: it is the one accent, and it reads
// on both grounds.
const CARD_TOKENS = {
  "--kov-bone": "#111217",
  "--kov-steel": "#7a808a",
  "--kov-concrete": "#5c626b",
  "--glass-border": "rgba(17,18,23,0.12)",
} as React.CSSProperties;

interface ActivationCardProps {
  number: string;
  /** How many cards there are in all. The sequence is real information
   * here: these six are stages of an approach, read in order. */
  total: number;
  title: string;
  body: string;
  /** Two or three micro-proofs, rendered as one metadata line under the
   * body and faded in when the card becomes the active one. */
  features?: string[];
  /** One of the six visual compositions (see ActivationCharts.tsx). */
  visual: ReactNode;
  /** Optional raster override for the recessed panel. The CSS/SVG visual
   * is the default and the fallback; this exists so a supplied asset can
   * be dropped in per card without touching the shell. */
  visualAsset?: string;
  /** True while this is the coverflow's current card. */
  active?: boolean;
  /** Narrow viewport. Drives the well height and the visual's scale through
   * CSS custom properties — the well used to be a hardcoded 200px regardless
   * of card size, which left 84px for everything below it on a phone and
   * clipped every card. */
  compact?: boolean;
  href?: string;
}

// A neumorphic off-white object on the section's dark field: three levels
// of relief, one light source.
//
//   1. the shell      — raised, and haloed when active
//   2. the well       — recessed, holding the visual
//   3. the pill       — raised, and pressed in on hover
//
// Not everything is in relief, which is what separates this from the 2019
// version of the idea: the type sits flat on the surface and only the
// objects you can act on, or look into, have depth.
export function ActivationCard({
  number,
  total,
  title,
  body,
  features,
  visual,
  visualAsset,
  active = false,
  compact = false,
  href,
}: ActivationCardProps) {
  const inner = (
    <div
      className={`kov-fcard${active ? " kov-fcard--active" : ""}`}
      style={
        compact
          ? ({ ...CARD_TOKENS, "--fc-well-h": "150px", "--fc-visual-scale": "0.78" } as React.CSSProperties)
          : CARD_TOKENS
      }
    >
      <div className="flex items-center justify-between shrink-0" style={{ padding: "22px 22px 0" }}>
        {/* The number as a red capsule, which is the one place a solid
            block of the accent is allowed. */}
        <span
          className="flex items-center justify-center font-mono text-kov-white"
          style={{
            width: 38,
            height: 30,
            borderRadius: 11,
            fontSize: 12,
            letterSpacing: "0.06em",
            fontVariantNumeric: "tabular-nums",
            background: "var(--fc-red)",
            boxShadow: "0 5px 12px -4px rgba(227,30,36,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          {number}
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.14em",
            fontVariantNumeric: "tabular-nums",
            color: "rgba(122,128,138,0.7)",
          }}
        >
          {number} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="kov-fcard__well shrink-0" style={{ margin: "18px 22px 0" }}>
        {visualAsset ? (
          // eslint-disable-next-line @next/next/no-img-element -- a supplied decorative asset sized by its container, not a content image worth next/image's wrapper
          <img src={visualAsset} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="kov-fcard__visual">{visual}</div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0" style={{ padding: "20px 22px 22px" }}>
        {/* Ordering matters here, and it is a repair as much as a layout.
            The body used to have flex's default min-height:auto, so it
            refused to shrink and the CTA pill was what fell out of the card's
            overflow:hidden. With the body as the only flexible item, any
            miscalculation at any viewport degrades to a truncated sentence
            instead of an amputated button. */}
        <p className="shrink-0" style={{ fontSize: 21, fontWeight: 650, lineHeight: 1.22, color: "var(--fc-ink)" }}>
          {title}
        </p>
        <p
          className="flex-1 min-h-0 overflow-hidden line-clamp-3"
          style={{ marginTop: 9, fontSize: 14, lineHeight: 1.5, color: "var(--fc-muted)", maxWidth: "30ch" }}
        >
          {body}
        </p>

        {/* One metadata line, not a bulleted list. Three bullets stacked
            vertically cost ~93px in a card that is already over budget, and
            they read as an offer checklist — the opposite of the "discreet
            micro-proof" this is meant to be. Inline, the same three terms
            cost ~39px and read as a specification. */}
        {features && features.length > 0 && (
          <ul
            className="kov-fcard__proof shrink-0 flex flex-wrap"
            style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--fc-line)", columnGap: 8, rowGap: 2 }}
          >
            {features.map((feature) => (
              <li key={feature} style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--fc-muted)" }}>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {href && (
          <span className="kov-fcard__cta shrink-0" style={{ marginTop: "auto" }}>
            En savoir plus
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );

  // The whole card is the link when it has a destination, so the pill and
  // the visual share one target rather than competing for the click.
  return href ? (
    // No aria-label: it would override the link's own content as the
    // accessible name, which is why neither the body nor the micro-proofs
    // were announced on any of these cards. The visible "En savoir plus"
    // pill already supplies the affordance.
    <Link href={href} className="block w-full h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}
