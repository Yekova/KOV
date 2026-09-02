"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";
import { Nav } from "@/components/navigation/Nav";
import { HeroGlobalMenuButton } from "@/components/layout/HeroGlobalMenuButton";
import { gsap, initGsap } from "@/lib/motion";

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
} as const;

const GLASS_CARD_STYLE = {
  ...GLASS_PILL_STYLE,
  borderRadius: "var(--radius-md)",
} as const;

// Real, non-fabricated facts only — no invented usage metrics (this is the
// studio's own marketing page, the one place credibility matters most).
// 6 = the actual discipline count from the Expertise section below; "1
// interlocuteur" and "code de production" both restate claims already made
// elsewhere on this page (the subhead, the Développement pillar), not new
// ones invented for this card.
const HERO_FACTS = [
  { value: "6", label: "Disciplines intégrées" },
  { value: "1", label: "Interlocuteur unique" },
  { value: "100%", label: "Code de production" },
];

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
        className="relative min-h-screen flex flex-col items-center px-6 pt-40 pb-28 md:pb-32"
        style={{ zIndex: "var(--z-content)" }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
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
              <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
                <KovCTA href="/contact">Démarrer un projet</KovCTA>
                <Button href="/#work-gallery" variant="pill">
                  Voir nos projets
                </Button>
              </div>
            </Reveal>

            <Reveal variant="fade" delay={0.55}>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-kov-steel text-[11px] uppercase tracking-widest">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
                  Sur-mesure, pas de template
                </span>
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
                  Code de production, pas de maquette
                </span>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal variant="fade" delay={0.65}>
          <div
            className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-6 p-6 md:p-8 border"
            style={GLASS_CARD_STYLE}
          >
            <p className="text-kov-bone text-sm leading-relaxed md:max-w-sm">
              Chaque projet est pensé comme un système : stratégie, design, développement, motion, systèmes et
              intégration — pas six prestations séparées qui se renvoient la responsabilité.
            </p>

            <div className="hidden md:block w-px self-stretch" style={{ background: "var(--kov-border)" }} />

            <div className="flex flex-1 flex-wrap items-center justify-between gap-6 w-full md:w-auto">
              {HERO_FACTS.map((fact) => (
                <div key={fact.label}>
                  <p className="font-display text-kov-bone text-2xl md:text-3xl">{fact.value}</p>
                  <p className="text-kov-steel text-[11px] uppercase tracking-widest mt-1">{fact.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      <HeroGlobalMenuButton />
    </section>
  );
}
