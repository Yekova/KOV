"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { gsap, initGsap } from "@/lib/motion";

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
} as const;

// Scaled up first, then scrubbed via GSAP yPercent — both set through GSAP
// (not a Tailwind scale class) so it tracks one combined transform instead
// of GSAP's translate overwriting a class-applied scale. The 20% oversize
// leaves a comfortable margin around the ±8% vertical drift so the scaled
// edge never shows.
const PARALLAX_SCALE = 1.2;
const PARALLAX_RANGE = 8;

// Fourth pass: the bordered-frame concept (previous 3 rounds) is dropped —
// back to a full-bleed section, no inset/radius/border, no glass header or
// footer strip. Nav and the global-menu button stay genuine DOM descendants
// of this section (position: absolute against it) rather than reverting to
// SiteChrome's fixed instances — that part of the earlier work is kept, it
// was never the "borders" being objected to. See SiteChrome.tsx and
// GlobalMenuContext.tsx for how the two positioning variants share state.
// (Both now switch to viewport-fixed once the page scrolls — see
// useScrolled.ts — so they stay reachable past the Hero, not just inside it.)
export function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const section = sectionRef.current;
    const image = imageRef.current;
    if (!section || !image) return;
    initGsap();

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: PARALLAX_SCALE, yPercent: -PARALLAX_RANGE });
      gsap.to(image, {
        yPercent: PARALLAX_RANGE,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
      });
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="hero" ref={sectionRef} className="relative min-h-screen overflow-hidden">
      <Image
        ref={imageRef}
        src="/kov/menu/atrium-brutaliste.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div
        className="absolute inset-0"
        style={{
          zIndex: "var(--z-atmosphere)",
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 30%, rgba(10,10,10,0.55) 65%, rgba(10,10,10,0.9) 100%)",
        }}
      />

      <Nav variant="contained" />

      <div
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ zIndex: "var(--z-content)" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <Reveal variant="fade">
            <span
              className="inline-flex items-center px-4 py-2 border text-xs uppercase tracking-widest text-kov-bone"
              style={{ ...GLASS_PILL_STYLE, borderRadius: "var(--radius-pill)" }}
            >
              Studio digital — Bordeaux, France
            </span>
          </Reveal>

          <Reveal variant="blur" delay={0.15}>
            <h1
              className="mt-8 font-display text-kov-bone uppercase"
              style={{ fontSize: "clamp(32px, 6vw, 100px)", lineHeight: "var(--line-height-display)" }}
            >
              DES SITES WEB
              <br />
              QUI TIENNENT<span className="text-kov-red">.</span>
            </h1>
          </Reveal>

          <Reveal variant="fade" delay={0.3}>
            <p className="mt-8 max-w-md mx-auto text-kov-concrete text-sm leading-relaxed">
              Design, développement et motion pensés comme un seul système —
              pas trois prestataires qui se renvoient la responsabilité.
            </p>
          </Reveal>

          <Reveal variant="fade" delay={0.45}>
            <KovCTA href="/contact" className="mt-10">
              Démarrer un projet
            </KovCTA>
          </Reveal>
        </div>
      </div>

      <HeroGlobalMenuButton />
    </section>
  );
}
