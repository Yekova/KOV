"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { damp } from "@/lib/damp";

// The character, profile view, pure black studio background — a still from
// the same clip that was previously scrubbed by scroll (that mechanism was
// dropped; the clip itself, public/kov/home/hero-cinematic.mp4, is still
// in the repo unused in case it's revisited later).
const PHOTO_SRC = "/kov/home/hero-character.jpg";

// Same damp()-based easing MouseFrameBackdrop.tsx already uses for
// continuous cursor tracking — frame-rate-independent, and consistent with
// the one other place on the site that does this rather than leaning on a
// CSS transition (which stutters under rapid mousemove since each event
// would restart it).
const LAMBDA = 8;
const TEXT_RANGE = 16; // px of drift for the "STUDIO" word — reads as further back
const PHOTO_RANGE = 32; // px of drift for the character photo — reads as closer, in front of the text

// Darkest over the text column (left), fading toward transparent on the
// right where the character sits — legibility without washing out the photo.
const LEFT_WEIGHTED_GRADIENT =
  "linear-gradient(90deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.1) 58%, rgba(10,10,10,0.05) 100%)";

// Just three elements — headline, subhead, two CTAs — matching a reference
// the user wants this text block to plainly look like. Left-aligned to sit
// in the photo's own negative space on the left of frame.
function HeroContent() {
  return (
    <div className="max-w-lg md:max-w-[46%]">
      <Reveal variant="blur">
        <h1
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "clamp(32px, 6vw, 100px)", lineHeight: "var(--line-height-display)" }}
        >
          DES SITES WEB
          <br />
          QUI TIENNENT<span className="text-kov-red">.</span>
        </h1>
      </Reveal>

      <Reveal variant="fade" delay={0.15}>
        <p className="mt-8 text-kov-concrete text-sm leading-relaxed">
          Design, développement et motion pensés comme un seul système —
          pas trois prestataires qui se renvoient la responsabilité.
        </p>
      </Reveal>

      <Reveal variant="fade" delay={0.3}>
        <div className="flex flex-wrap items-center gap-4 mt-10">
          <KovCTA href="/contact">Démarrer un projet</KovCTA>
          <Button href="/#work-gallery" variant="pill">
            Voir nos projets
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

export function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<HTMLParagraphElement>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    const section = sectionRef.current;
    const photo = photoRef.current;
    const studio = studioRef.current;
    if (!section || !photo || !studio) return;

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
      studio!.style.transform = `translate(${currentX.current * TEXT_RANGE}px, ${currentY.current * TEXT_RANGE}px)`;
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
      {/* Giant "STUDIO" word behind the character. The photo above it uses
          mix-blend-mode: screen — screen(black, x) = x, so the photo's own
          near-black studio background lets this text show straight through
          while the brighter parts of the character (helmet, lit edges)
          still read clearly on top. No actual cutout/masking needed. */}
      <p
        ref={studioRef}
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center font-display text-white uppercase select-none pointer-events-none"
        style={{ fontSize: "clamp(120px, 20vw, 420px)", letterSpacing: "-0.02em", zIndex: "var(--z-canvas)" }}
      >
        STUDIO
      </p>

      <div
        ref={photoRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: "var(--z-atmosphere)", mixBlendMode: "screen" }}
      >
        <Image src={PHOTO_SRC} alt="" aria-hidden="true" fill priority sizes="100vw" className="object-cover" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: "var(--z-layer-secondary)", background: LEFT_WEIGHTED_GRADIENT }}
      />

      <Nav variant="contained" />

      <div
        className="relative min-h-screen flex flex-col justify-center px-6 md:px-16"
        style={{ zIndex: "var(--z-content)" }}
      >
        <HeroContent />
      </div>

      <HeroGlobalMenuButton />
    </section>
  );
}
