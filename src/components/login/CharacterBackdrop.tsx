"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "@/lib/motion";

const CHARACTER_SRC = "/kov/character/character-reference-sheet.png";
const IMAGE_POSITION = "50% 10%";

// Helmet position within the source image (percent of the rendered "cover"
// box) — tuned by eye against the actual asset, not measured pixels.
const HEAD_MASK = "13% 10% at 50% 16.5%";

export function CharacterBackdrop() {
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
        const shiftX = relX * 16;
        const shiftY = relY * 9;
        const tilt = relX * 2.5;
        if (el) {
          el.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0) rotate(${tilt}deg)`;
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
    <div className="absolute inset-y-0 right-0 w-[72%] overflow-hidden pointer-events-none" aria-hidden="true">
      <Image
        src={CHARACTER_SRC}
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 0px"
        className="object-cover"
        style={{ objectPosition: IMAGE_POSITION, opacity: 0.92 }}
        priority
      />
      <div
        ref={headRef}
        className="absolute inset-0"
        style={{
          WebkitMaskImage: `radial-gradient(${HEAD_MASK}, black 55%, transparent 100%)`,
          maskImage: `radial-gradient(${HEAD_MASK}, black 55%, transparent 100%)`,
          transition: `transform ${motion.slow}s cubic-bezier(0.16, 1, 0.3, 1)`,
          willChange: "transform",
        }}
      >
        <Image
          src={CHARACTER_SRC}
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 0px"
          className="object-cover"
          style={{ objectPosition: IMAGE_POSITION }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, var(--kov-black) 0%, rgba(10,10,10,0.35) 30%, transparent 60%)" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 55%, var(--kov-black) 100%)" }}
      />
    </div>
  );
}
