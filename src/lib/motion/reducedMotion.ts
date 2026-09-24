// Deliberately its own module, with no imports.
//
// This used to live in scroll.ts next to the GSAP setup, which meant that a
// component wanting nothing but this one-line media-query check — Nav,
// Lightning, the studio map — pulled GSAP + ScrollTrigger +
// CustomEase into its chunk to get it. ~118 KB for a boolean.
//
// Read it once, during render, rather than in an effect (see Reveal.tsx):
// components can then decline to build an animation at all, instead of
// building one and immediately neutering it.
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Does this viewport get the scroll choreography?
//
// One predicate, called from every scrubbed homepage scene, so "desktop
// only" is a single decision in a single place rather than four copies of a
// media query that drift apart.
//
// Two reasons to answer no, and they are not the same reason:
//
//   - reduced motion. An accessibility preference, and the site's rule is to
//     decline to build the scene rather than build it and freeze it, so the
//     plain content underneath is what renders.
//   - narrow viewports. The owner's decision, and a sound one: a phone pays
//     for scroll choreography in battery and jank, the homepage was
//     deliberately simplified there, and a scrubbed scene competes with the
//     one gesture a touch visitor has. 1024px rather than the 768px used for
//     layout breaks, because "ordinateur" is not a tablet held in one hand.
//
// Read during render or at the top of an effect, never stored: a window
// resized across the threshold should get the right answer on its next
// mount, and the scenes below all re-run when it changes.
export function scrollScenesEnabled() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return window.matchMedia("(min-width: 1024px)").matches;
}
