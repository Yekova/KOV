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

// Re-exported, not defined here: it lives in its own import-free module so
// that components needing only the media-query check don't drag GSAP in
// with it. Kept exported from this path so existing callers still resolve.
export { prefersReducedMotion } from "./reducedMotion";
