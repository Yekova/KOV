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

    // mousemove fires faster than the compositor can paint, and every
    // handler that writes `transform` synchronously invalidates style on
    // its own. Record the coordinates on the event, write them once per
    // frame — the cursor lands in exactly the same place, but a burst of
    // twelve events between two frames now costs one write, not twelve.
    let pending = 0;
    let nextX = 0;
    let nextY = 0;

    function flush() {
      pending = 0;
      if (!dot) return;
      dot.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%)`;
    }

    function handleMove(event: MouseEvent) {
      nextX = event.clientX;
      nextY = event.clientY;
      if (!pending) pending = requestAnimationFrame(flush);
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

    // Pointer lock stops reporting clientX/clientY — the Brand Gallery
    // takes the lock to look around — so the dot would otherwise freeze
    // wherever it was and sit there for the whole visit.
    function handleLockChange() {
      if (dot) dot.style.visibility = document.pointerLockElement ? "hidden" : "";
    }

    // passive: none of the three ever calls preventDefault, and saying so
    // lets the browser stop waiting on them before it scrolls.
    window.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseover", handleOver, { passive: true });
    document.addEventListener("mouseout", handleOut, { passive: true });
    document.addEventListener("pointerlockchange", handleLockChange);

    return () => {
      document.documentElement.classList.remove("kov-custom-cursor");
      if (pending) cancelAnimationFrame(pending);
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
      document.removeEventListener("pointerlockchange", handleLockChange);
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
