// Both curves are defined once, as raw bezier control points, then rendered
// into two different syntaxes (CSS `cubic-bezier()` and GSAP's CustomEase
// SVG-path format) — so the hand-rolled CSS transitions (Reveal.tsx, Nav's
// pill unfurl) and the new GSAP ScrollTrigger work share an identical curve
// instead of two similar-looking approximations.
const LIQUID_POINTS = [0.4, 0, 0.2, 1] as const;
const REVEAL_POINTS = [0.22, 1, 0.36, 1] as const;

function toCssCubicBezier(points: readonly [number, number, number, number]) {
  return `cubic-bezier(${points.join(", ")})`;
}

function toGsapCustomEasePath(points: readonly [number, number, number, number]) {
  const [x1, y1, x2, y2] = points;
  return `M0,0 C${x1},${y1} ${x2},${y2} 1,1`;
}

// Smooth accelerate-decelerate, no overshoot — see docs/KOV-MOTION.md
// ("éviter : spring exagéré, bounce"). Used for the liquid nav indicator
// and the search reveal so both share one motion signature.
export const LIQUID_EASE = toCssCubicBezier(LIQUID_POINTS);

// Fast-out, long gentle settle — no overshoot either, just a different feel
// than LIQUID_EASE (which is symmetric). Used for reveal/unfurl moments
// where something needs to arrive with a bit more initial snap: the nav
// pill's entrance on route change, wizard step transitions.
export const REVEAL_EASE = toCssCubicBezier(REVEAL_POINTS);

// Names to pass as `ease:` in GSAP tweens once registerGsapEases() has run
// (see scroll.ts — called once, client-side, before any ScrollTrigger
// animation mounts). Kept as a single source of truth with the CSS strings
// above rather than picking GSAP's closest built-in power/expo ease by eye.
export const GSAP_LIQUID_EASE = "kovLiquid";
export const GSAP_REVEAL_EASE = "kovReveal";

export function registerGsapEases(CustomEase: { create: (name: string, path: string) => unknown }) {
  CustomEase.create(GSAP_LIQUID_EASE, toGsapCustomEasePath(LIQUID_POINTS));
  CustomEase.create(GSAP_REVEAL_EASE, toGsapCustomEasePath(REVEAL_POINTS));
}
