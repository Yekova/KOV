"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";

const CHARACTER_SRC = "/kov/character/character-reference-sheet.png";
const IMAGE_POSITION = "50% 8%";

// Helmet position within the source image (percent of the rendered "cover"
// box) — tuned by eye against the actual asset, not measured pixels.
const HEAD_MASK = "16% 12% at 50% 15%";
// Pivot for the head's rotation — the base of the helmet (near the neck),
// so it reads as the head turning in place rather than sliding/detaching.
const HEAD_PIVOT = "50% 27%";

export function CharacterColumn() {
  const headRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const el = headRef.current;
    if (prefersReducedMotion || !isFinePointer || !el) return;

    function handleMove(event: MouseEvent) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const relX = event.clientX / window.innerWidth - 0.5;
        const relY = event.clientY / window.innerHeight - 0.5;
        // Rotating around the neck (see HEAD_PIVOT) rather than translating
        // the whole masked disc — a large lateral shift visibly detached the
        // head from the body and exposed the static head underneath.
        const rotateY = relX * 34;
        const rotateX = relY * -9;
        const shiftX = relX * 18;
        if (el) {
          el.style.transform = `perspective(700px) translateX(${shiftX}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
      });
    }

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          // Hole punched exactly where the head layer sits, so the moving
          // head never reveals a second, static one underneath.
          WebkitMaskImage: `radial-gradient(${HEAD_MASK}, transparent 60%, black 100%)`,
          maskImage: `radial-gradient(${HEAD_MASK}, transparent 60%, black 100%)`,
        }}
      >
        <Image
          src={CHARACTER_SRC}
          alt=""
          fill
          sizes="(min-width: 1024px) 40vw, 0px"
          className="object-cover"
          style={{ objectPosition: IMAGE_POSITION, opacity: 0.94 }}
          priority
        />
      </div>
      <div
        ref={headRef}
        className="absolute inset-0"
        style={{
          WebkitMaskImage: `radial-gradient(${HEAD_MASK}, black 55%, transparent 100%)`,
          maskImage: `radial-gradient(${HEAD_MASK}, black 55%, transparent 100%)`,
          transformOrigin: HEAD_PIVOT,
          transition: `transform ${motion.fast}s cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: "transform",
        }}
      >
        <Image
          src={CHARACTER_SRC}
          alt=""
          fill
          sizes="(min-width: 1024px) 40vw, 0px"
          className="object-cover"
          style={{ objectPosition: IMAGE_POSITION }}
        />
      </div>
      {/* Soft vignette on all sides — this is now a standalone column with
          black page on both sides, not tucked behind copy, so the fade
          needs to read as a blend on every edge rather than one direction. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--kov-black) 0%, transparent 18%, transparent 82%, var(--kov-black) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--kov-black) 0%, transparent 22%, transparent 68%, var(--kov-black) 100%)",
        }}
      />
    </div>
  );
}
