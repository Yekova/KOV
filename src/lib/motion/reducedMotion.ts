// Deliberately its own module, with no imports.
//
// This used to live in scroll.ts next to the GSAP setup, which meant that a
// component wanting nothing but this one-line media-query check — Nav,
// LightPillar, Lightning, the studio map — pulled GSAP + ScrollTrigger +
// CustomEase into its chunk to get it. ~118 KB for a boolean.
//
// Read it once, during render, rather than in an effect (see Reveal.tsx):
// components can then decline to build an animation at all, instead of
// building one and immediately neutering it.
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
