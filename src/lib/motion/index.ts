"use client";

// Barrel re-export — keeps `@/lib/motion` resolving exactly as it did when
// this was a single file.
//
// Import from it only if you actually need GSAP. Because `./scroll` imports
// gsap at module scope, and gsap is not side-effect-free, pulling anything
// through this barrel pulls the whole engine — so a component that wanted
// just `LIQUID_EASE` (four numbers) was paying ~118 KB for it. The leaf
// modules are the right target for everything else:
//
//   @/lib/motion/timing         motion, stagger
//   @/lib/motion/easing         LIQUID_EASE, REVEAL_EASE, GSAP_*_EASE
//   @/lib/motion/reducedMotion  prefersReducedMotion
//   @/lib/motion/scroll         gsap, ScrollTrigger, initGsap
//   @/lib/motion/transitions    fadeUpIn, dissolve, staggerReveal, pinAndTrack
export { motion, stagger, type MotionSpeed, type StaggerSpacing } from "./timing";
export { LIQUID_EASE, REVEAL_EASE, GSAP_LIQUID_EASE, GSAP_REVEAL_EASE } from "./easing";
export { gsap, ScrollTrigger, initGsap } from "./scroll";
export { prefersReducedMotion, scrollScenesEnabled } from "./reducedMotion";
export { fadeUpIn, dissolve, staggerReveal, pinAndTrack } from "./transitions";
