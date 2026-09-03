"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { getLightZones } from "@/lib/navThemeRegistry";

// True whenever `ref`'s own element currently overlaps a registered light
// zone (see useLightZone) — a plain rAF-throttled rect comparison on
// scroll/resize, same lightweight approach as useScrolled, rather than an
// IntersectionObserver: this is a two-rect overlap test between two
// independently-moving elements (the fixed nav vs. whatever's scrolled
// under it), not a single element's visibility threshold against the
// viewport, which is what IO is built for.
export function useOnLightZone(ref: RefObject<Element | null>) {
  const [onLight, setOnLight] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    function check() {
      rafRef.current = 0;
      const el = ref.current;
      if (!el) return;
      const a = el.getBoundingClientRect();
      let hit = false;
      for (const zone of getLightZones()) {
        const b = zone.getBoundingClientRect();
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
          hit = true;
          break;
        }
      }
      setOnLight(hit);
    }

    function schedule() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(check);
    }

    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ref]);

  return onLight;
}
