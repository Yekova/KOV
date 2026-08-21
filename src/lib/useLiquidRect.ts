"use client";

import { useLayoutEffect, useRef, useState } from "react";

export interface LiquidRect {
  left: number;
  width: number;
}

// Measures the target item's position/width relative to its container,
// re-measuring on resize. Shared by every "liquid blob" indicator (nav
// links, wizard step progress) so they track a moving target the same way.
export function useLiquidRect<T extends HTMLElement>(targetIndex: number | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(T | null)[]>([]);
  const [rect, setRect] = useState<LiquidRect | null>(null);

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const el = targetIndex !== null ? itemRefs.current[targetIndex] : null;
      if (!container || !el) {
        setRect(null);
        return;
      }
      const containerBox = container.getBoundingClientRect();
      const elBox = el.getBoundingClientRect();
      setRect({ left: elBox.left - containerBox.left, width: elBox.width });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [targetIndex]);

  return { containerRef, itemRefs, rect };
}
