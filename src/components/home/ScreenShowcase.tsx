"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap, initGsap, motion, GSAP_REVEAL_EASE } from "@/lib/motion";
import { ScrollFloat } from "@/components/ui/ScrollFloat";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { useLightZone } from "@/hooks/useLightZone";

interface ScreenShowcaseProps {
  /** Not supplied yet — renders an honest placeholder until it is. When a
   * real screenshot is ready, passing this from page.tsx is the only change
   * needed; the frame/reveal around it stays the same. */
  screenshotSrc?: string;
}

// Right after the Hero — a browser-window card that arrives from below on
// scroll, empty for now (the user will drop a real site screenshot in via
// `screenshotSrc`). A bigger, more deliberate "arrival" than Reveal.tsx's
// routine 28px rise: this is a one-off showcase moment, not a standard
// section reveal, so it gets its own GSAP tween instead of the shared
// fadeUpIn preset.
export function ScreenShowcase({ screenshotSrc }: ScreenShowcaseProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  // Registers the actual screenshot area (not the card's dark chrome bar)
  // as a light zone — see Nav.tsx/GlobalMenuButton.tsx, which flip their
  // text/logo to black whenever they scroll over this. Only while there's a
  // real (light) screenshot to flag; the dark placeholder isn't one.
  useLightZone(screenRef, Boolean(screenshotSrc));

  useEffect(() => {
    if (reducedMotion) return;
    const card = cardRef.current;
    if (!card) return;
    initGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 120, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: motion.slow,
          ease: GSAP_REVEAL_EASE,
          // "top bottom" — the earliest possible onset (as soon as the
          // card's top edge is even reachable at the bottom of the
          // viewport) rather than waiting until it's mostly scrolled into
          // view, so the card starts arriving as soon as it can rather
          // than after a gap once the Hero above it has fully passed.
          scrollTrigger: { trigger: card, start: "top bottom", toggleActions: "play none none reverse" },
        }
      );
    }, card);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="showcase" className="px-6 py-32 max-w-[1600px] mx-auto">
      <ScrollFloat
        containerClassName="text-center mb-24 md:mb-36"
        textClassName="font-display text-kov-bone uppercase text-[clamp(28px,4vw,64px)] leading-[var(--line-height-display)]"
        stagger={0.02}
      >
        Votre système intégré
      </ScrollFloat>

      <div
        ref={cardRef}
        className="max-w-[1200px] mx-auto border overflow-hidden"
        style={{
          borderColor: "var(--kov-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 40px 90px rgba(0, 0, 0, 0.55)",
        }}
      >
        <BrowserChrome />

        <div ref={screenRef} className="relative w-full" style={{ aspectRatio: "16 / 10", background: "var(--kov-carbon)" }}>
          {screenshotSrc ? (
            <Image
              src={screenshotSrc}
              alt="Aperçu du tableau de bord — système intégré KOV"
              fill
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-kov-steel text-xs uppercase tracking-widest">Aperçu du site à venir</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
