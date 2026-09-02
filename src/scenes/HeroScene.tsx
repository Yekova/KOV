"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { damp } from "@/lib/damp";

// Character in profile, "STUDIO" typography already composited into the
// shot (not a separate DOM text layer/blend-mode trick anymore — this
// image was supplied pre-finished).
const PHOTO_SRC = "/kov/home/hero-character-studio.jpg";

// Same damp()-based easing MouseFrameBackdrop.tsx already uses for
// continuous cursor tracking — frame-rate-independent, consistent with the
// one other place on the site doing this rather than a CSS transition
// (which stutters under rapid mousemove since each event restarts it).
const LAMBDA = 8;
const PHOTO_RANGE = 24; // px of drift on mouse move

// Bottom-weighted, not left-weighted — there's no single text column to
// favor one side for anymore; all three CTAs sit low (3/4 height) on both
// left and right, so the legibility gradient needs to darken the bottom
// evenly rather than one side.
const BOTTOM_WEIGHTED_GRADIENT =
  "linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.1) 55%, rgba(10,10,10,0.55) 78%, rgba(10,10,10,0.85) 100%)";

export function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    const photo = photoRef.current;
    if (!section || !photo) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reducedMotion || !finePointer) return;

    function handleMove(event: PointerEvent) {
      const rect = section!.getBoundingClientRect();
      targetX.current = (event.clientX - rect.left) / rect.width - 0.5;
      targetY.current = (event.clientY - rect.top) / rect.height - 0.5;
    }
    function handleLeave() {
      targetX.current = 0;
      targetY.current = 0;
    }

    section.addEventListener("pointermove", handleMove);
    section.addEventListener("pointerleave", handleLeave);

    let raf = 0;
    let last = performance.now();
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      currentX.current = damp(currentX.current, targetX.current, LAMBDA, dt);
      currentY.current = damp(currentY.current, targetY.current, LAMBDA, dt);
      photo!.style.transform = `translate(${currentX.current * PHOTO_RANGE}px, ${currentY.current * PHOTO_RANGE}px)`;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      section.removeEventListener("pointermove", handleMove);
      section.removeEventListener("pointerleave", handleLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--kov-black)" }}
    >
      {/* -inset-8, not inset-0 — a small overscan margin so the mouse-
          parallax translate (±24px) never exposes an edge of the image. */}
      <div ref={photoRef} className="absolute -inset-8 pointer-events-none" style={{ zIndex: "var(--z-canvas)" }}>
        <Image src={PHOTO_SRC} alt="" aria-hidden="true" fill priority sizes="100vw" className="object-cover" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: "var(--z-atmosphere)", background: BOTTOM_WEIGHTED_GRADIENT }}
      />

      <Nav variant="contained" />

      {/* Two CTAs left, one on the other side — no headline/subhead text
          anymore, the image itself carries the "Studio" statement. All
          three sit at 3/4 of the section's height. */}
      <div
        className="absolute left-6 md:left-16 flex flex-wrap items-center gap-4"
        style={{ top: "75%", transform: "translateY(-50%)", zIndex: "var(--z-content)" }}
      >
        <KovCTA href="/contact">Démarrer un projet</KovCTA>
        <Button href="/#work-gallery" variant="pill">
          Voir nos projets
        </Button>
      </div>

      <div
        className="absolute right-6 md:right-16"
        style={{ top: "75%", transform: "translateY(-50%)", zIndex: "var(--z-content)" }}
      >
        <Button href="/studio" variant="pill">
          Découvrir le studio
        </Button>
      </div>

      <HeroGlobalMenuButton />
    </section>
  );
}
