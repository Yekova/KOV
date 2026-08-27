"use client";

import { gsap, ScrollTrigger, initGsap } from "./scroll";
import { motion, stagger } from "./timing";
import { GSAP_LIQUID_EASE, GSAP_REVEAL_EASE } from "./easing";

// Reusable ScrollTrigger-driven presets — every homepage scene built on top
// of GSAP should reach for one of these rather than hand-writing raw tween
// params, so duration/easing/stagger stay consistent across sections instead
// of drifting section-by-section. Each function calls initGsap() itself
// (idempotent), so callers don't need to coordinate a single init call site.

// The GSAP equivalent of Reveal.tsx's "fade" variant — for elements inside
// a pinned/scrubbed scene where a plain IntersectionObserver can't drive
// per-frame progress against a shared timeline.
export function fadeUpIn(target: gsap.TweenTarget, trigger: Element | string, opts: { delay?: number } = {}) {
  initGsap();
  return gsap.fromTo(
    target,
    { opacity: 0, y: 28 },
    {
      opacity: 1,
      y: 0,
      duration: motion.slow,
      delay: opts.delay ?? 0,
      ease: GSAP_LIQUID_EASE,
      scrollTrigger: { trigger, start: "top 80%", toggleActions: "play none none reverse" },
    }
  );
}

// One element dissolves into another — opacity + a light blur, at the same
// spot (caller positions both absolutely, e.g. inset-0 siblings). Matches
// "CARD A → dissolution → CARD B" more literally than a hard cut.
export function dissolve(
  from: gsap.TweenTarget,
  to: gsap.TweenTarget,
  opts: { trigger: Element | string; scrub?: boolean | number }
) {
  initGsap();
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: opts.trigger,
      start: "top 60%",
      end: "top 20%",
      scrub: opts.scrub ?? true,
    },
  });
  tl.set(to, { opacity: 0, filter: "blur(12px)" })
    .to(from, { opacity: 0, filter: "blur(12px)", duration: motion.normal, ease: GSAP_REVEAL_EASE }, 0)
    .to(to, { opacity: 1, filter: "blur(0px)", duration: motion.normal, ease: GSAP_REVEAL_EASE }, 0.1);
  return tl;
}

// Staggered reveal for a group of siblings (a card row, a pillar grid) —
// same visual language as Reveal.tsx's default fade, scroll-scrubbed via
// ScrollTrigger instead of IntersectionObserver for scenes that need to
// coordinate with other scrubbed elements on the same timeline.
export function staggerReveal(
  targets: gsap.TweenTarget,
  trigger: Element | string,
  opts: { spacing?: keyof typeof stagger } = {}
) {
  initGsap();
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: motion.normal,
      ease: GSAP_LIQUID_EASE,
      stagger: stagger[opts.spacing ?? "normal"],
      scrollTrigger: { trigger, start: "top 75%", toggleActions: "play none none reverse" },
    }
  );
}

// A pinned section whose scroll progress (0→1) drives caller-supplied
// logic — e.g. Expertise's "six disciplines converge into one system."
// Returns the ScrollTrigger instance so the caller can kill it on unmount.
export function pinAndTrack(
  trigger: Element | string,
  onUpdate: (progress: number) => void,
  opts: { end?: string; pin?: boolean } = {}
) {
  initGsap();
  return ScrollTrigger.create({
    trigger,
    start: "top top",
    end: opts.end ?? "+=100%",
    pin: opts.pin ?? true,
    scrub: true,
    onUpdate: (self) => onUpdate(self.progress),
  });
}
