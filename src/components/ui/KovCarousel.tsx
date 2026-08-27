"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { motion, LIQUID_EASE } from "@/lib/motion";

interface KovCarouselProps {
  items: ReactNode[];
  /** Accessible label per slide, e.g. project names — falls back to "Diapositive N." */
  labels?: string[];
}

const DRAG_THRESHOLD = 60;

// Drag on desktop, swipe on mobile, arrow buttons, indicators, arrow-key
// navigation — all through the same Pointer Events handlers (unified
// mouse/touch/pen), rather than separate mouse and touch code paths.
//
// Deliberately not scroll-driven (advancing slides by hijacking vertical
// page scroll): that pattern reads as immersive in a demo and disorienting
// in practice — a drag/arrow/indicator carousel already delivers the
// "immersive, not e-commerce" feel the brief asks for without fighting the
// user's own scroll gesture.
export function KovCarousel({ items, labels }: KovCarouselProps) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const count = items.length;

  function goTo(next: number) {
    setIndex(Math.max(0, Math.min(count - 1, next)));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    setIsDragging(true);
    startX.current = event.clientX;
    setDragX(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setDragX(event.clientX - startX.current);
  }

  function handlePointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX < -DRAG_THRESHOLD) goTo(index + 1);
    else if (dragX > DRAG_THRESHOLD) goTo(index - 1);
    setDragX(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") goTo(index + 1);
    if (event.key === "ArrowLeft") goTo(index - 1);
  }

  return (
    <div className="w-full">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Projets"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing outline-none select-none"
      >
        <div
          className="flex"
          style={{
            transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
            transition: isDragging ? "none" : `transform ${motion.slow}s ${LIQUID_EASE}`,
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={labels?.[i] ?? `Diapositive ${i + 1} sur ${count}`}
              aria-hidden={i !== index}
              className="w-full shrink-0 px-1"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Projet précédent"
          className="w-10 h-10 flex items-center justify-center border text-kov-bone disabled:opacity-30 hover:text-kov-red transition-colors"
          style={{ borderColor: "var(--glass-border)", borderRadius: "var(--radius-pill)" }}
        >
          ←
        </button>

        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Aller au projet ${i + 1}`}
              aria-current={i === index}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i === index ? "var(--kov-red)" : "var(--kov-border)" }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === count - 1}
          aria-label="Projet suivant"
          className="w-10 h-10 flex items-center justify-center border text-kov-bone disabled:opacity-30 hover:text-kov-red transition-colors"
          style={{ borderColor: "var(--glass-border)", borderRadius: "var(--radius-pill)" }}
        >
          →
        </button>
      </div>
    </div>
  );
}
