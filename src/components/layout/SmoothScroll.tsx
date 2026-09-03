"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, initGsap, prefersReducedMotion } from "@/lib/motion";

// Sitewide inertia scroll for the marketing pages — mounted from
// SiteChromeInner, which already excludes /admin and /client (a dampened,
// weighted scroll fits the marketing site's cinematic feel but would fight
// a data-dense back-office tool). Longer duration + a steeper ease-out than
// Lenis' own default is what actually reads as "heavier" — scroll keeps
// drifting further after the wheel input stops. Skipped entirely under
// prefers-reduced-motion, same as every other animated piece in this
// codebase — native instant scroll stays the default there.
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    initGsap();

    const lenis = new Lenis({
      duration: 1.8,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      wheelMultiplier: 0.85,
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
