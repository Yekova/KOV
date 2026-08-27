"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { registerGsapEases } from "./easing";

let initialized = false;

// Idempotent — every scroll-driven section can call this in its own mount
// effect without coordinating a single app-wide call site. Guarded against
// SSR since GSAP/ScrollTrigger touch window/document.
export function initGsap() {
  if (initialized || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  registerGsapEases(CustomEase);
  initialized = true;
  return gsap;
}

export { gsap, ScrollTrigger };

// Lazy initializer pattern (see Reveal.tsx) — read once, not in an effect,
// so components can bail out of building a ScrollTrigger timeline entirely
// rather than building one and immediately neutering it.
export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
