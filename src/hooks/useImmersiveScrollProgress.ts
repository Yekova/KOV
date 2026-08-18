"use client";

import { useEffect, useState } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

// The immersive scroll-scrubbed intro (hero/enter/work) only occupies the TOP
// portion of the home page now that regular sections follow it. This measures
// where the #work section actually ends and rescales global scroll progress
// into a 0-1 range local to the immersive zone, instead of scenes.ts fractions
// going stale the moment non-scene content is appended below (see scenes.ts).
export function useImmersiveScrollProgress() {
  const globalProgress = useScrollProgress();
  const [endFraction, setEndFraction] = useState(1);

  useEffect(() => {
    function measure() {
      const el = document.getElementById("work");
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (!el || scrollable <= 0) {
        setEndFraction(1);
        return;
      }
      const endOffset = el.offsetTop + el.offsetHeight;
      setEndFraction(Math.min(1, Math.max(0.01, endOffset / scrollable)));
    }

    measure();
    window.addEventListener("resize", measure);
    const el = document.getElementById("work");
    const observer = new ResizeObserver(measure);
    if (el) observer.observe(el);
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  const progress = Math.min(1, globalProgress / endFraction);
  const active = globalProgress <= endFraction;

  return { progress, active };
}
