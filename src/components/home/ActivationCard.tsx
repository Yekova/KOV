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
  /** Only card 4 ("Performance durable") passes this. */
  features?: string[];
  /** One of the six visual compositions (see ActivationCharts.tsx). */
  visual: ReactNode;
  /** Optional raster override for the recessed panel. The CSS/SVG visual
   * is the default and the fallback; this exists so a supplied asset can
   * be dropped in per card without touching the shell. */
  visualAsset?: string;
  /** True while this is the coverflow's current card. */
  active?: boolean;
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
  href,
}: ActivationCardProps) {
  const inner = (
    <div className={`kov-fcard${active ? " kov-fcard--active" : ""}`} style={CARD_TOKENS}>
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

      <div className="kov-fcard__well shrink-0" style={{ margin: "18px 22px 0", height: 200 }}>
        {visualAsset ? (
          // eslint-disable-next-line @next/next/no-img-element -- a supplied decorative asset sized by its container, not a content image worth next/image's wrapper
          <img src={visualAsset} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="kov-fcard__visual">{visual}</div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0" style={{ padding: "20px 22px 22px" }}>
        <p style={{ fontSize: 21, fontWeight: 650, lineHeight: 1.22, color: "var(--fc-ink)" }}>{title}</p>
        <p style={{ marginTop: 9, fontSize: 14, lineHeight: 1.5, color: "var(--fc-muted)", maxWidth: "30ch" }}>
          {body}
        </p>

        {features && features.length > 0 && (
          <ul className="space-y-1.5" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--fc-line)" }}>
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2" style={{ fontSize: 12.5, color: "var(--fc-muted)" }}>
                <span aria-hidden="true" className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--fc-red)" }} />
                {feature}
              </li>
            ))}
          </ul>
        )}

        <div className="flex-1 min-h-3" />

        {href && (
          <span className="kov-fcard__cta">
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
    <Link href={href} className="block w-full h-full" aria-label={`${title} — en savoir plus`}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
