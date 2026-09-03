"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

// Mounted once at the root layout — initializes the AOS scroll-animation
// engine for any element in the tree using data-aos attributes. Distinct
// from the site's GSAP/ScrollTrigger setup (src/lib/motion, Reveal.tsx),
// which stays the default for everything already built on it; this is for
// new work that opts into AOS's declarative data-aos markup instead.
export function AosInit() {
  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
      disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, []);

  return null;
}
