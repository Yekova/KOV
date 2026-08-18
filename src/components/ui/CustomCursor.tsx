"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, [role="button"]';

// Custom cursor — direct DOM/style writes on mousemove (no React state) to
// avoid a re-render on every pixel of movement. Skips entirely on touch
// devices and under prefers-reduced-motion, where the native cursor stays.
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || prefersReducedMotion) return;

    document.documentElement.classList.add("kov-custom-cursor");
    const dot = dotRef.current;
    if (!dot) return;

    function handleMove(event: MouseEvent) {
      if (!dot) return;
      dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    }

    function handleOver(event: MouseEvent) {
      if (!dot) return;
      const target = event.target as Element | null;
      if (target?.closest(INTERACTIVE_SELECTOR)) {
        dot.classList.add("kov-cursor-hover");
      }
    }

    function handleOut(event: MouseEvent) {
      if (!dot) return;
      const target = event.target as Element | null;
      if (target?.closest(INTERACTIVE_SELECTOR)) {
        dot.classList.remove("kov-cursor-hover");
      }
    }

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);

    return () => {
      document.documentElement.classList.remove("kov-custom-cursor");
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="kov-cursor-dot fixed top-0 left-0 pointer-events-none hidden"
      style={{ zIndex: "var(--z-cursor)" }}
    />
  );
}
