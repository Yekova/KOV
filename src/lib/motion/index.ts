"use client";

// Barrel re-export — keeps `@/lib/motion` resolving exactly as it did when
// this was a single file, so existing consumers (Reveal.tsx, Nav.tsx,
// GlobalSearch.tsx, etc.) importing `{ motion, LIQUID_EASE, REVEAL_EASE }`
// don't need to change. New scroll-driven work should reach for the more
// specific modules directly (`@/lib/motion/scroll`, `@/lib/motion/transitions`).
export { motion, stagger, type MotionSpeed, type StaggerSpacing } from "./timing";
export { LIQUID_EASE, REVEAL_EASE, GSAP_LIQUID_EASE, GSAP_REVEAL_EASE } from "./easing";
export { gsap, ScrollTrigger, initGsap, prefersReducedMotion } from "./scroll";
export { fadeUpIn, dissolve, staggerReveal, pinAndTrack } from "./transitions";
