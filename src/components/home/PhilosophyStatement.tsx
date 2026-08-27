"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { PRINCIPLES } from "@/data/studioPrinciples";
import { gsap, initGsap, GSAP_LIQUID_EASE } from "@/lib/motion";

const WORD_COUNT = PRINCIPLES.length;
const SLOT_SPACING_X = 220;
const SLOT_SPACING_Y = 140;

// Four settled positions in a 2x2 grid below where the huge word sits —
// where each word ends up once it's no longer "on stage." A single row
// doesn't work here: "Intentionnel" is roughly twice as long as the other
// three words, so any row tight enough to read as "settled, secondary"
// crowds it into its neighbor. Two words per row leaves each one room
// regardless of viewport width — same reasoning as ExpertiseTeaser's arc
// radius scaling down on narrow screens, different fix for this shape.
function getSlotPositions(spacingX: number, spacingY: number) {
  return PRINCIPLES.map((_, index) => ({
    x: (index % 2 === 0 ? -1 : 1) * spacingX,
    y: (index < 2 ? -1 : 1) * spacingY + 160,
  }));
}

// The brief's §18: each principle takes over the screen as a huge word in
// turn, then recedes to a small settled slot as the next one arrives — "une
// composition typographique vivante," not four static cards. Same pattern
// as ExpertiseTeaser's convergence scene: a pinned GSAP sequence for the
// "wow" beat, with the exact same four principles rendering as a plain,
// fully readable grid below (unchanged) for the "information" beat and the
// reduced-motion / no-JS fallback.
export function PhilosophyStatement() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [spacingX] = useState(() => (typeof window !== "undefined" ? Math.min(SLOT_SPACING_X, window.innerWidth * 0.28) : SLOT_SPACING_X));
  const slots = useMemo(() => getSlotPositions(spacingX, SLOT_SPACING_Y), [spacingX]);

  useEffect(() => {
    if (reducedMotion) return;
    const scene = sceneRef.current;
    if (!scene) return;
    initGsap();

    const words = Array.from(scene.querySelectorAll<HTMLElement>("[data-word]"));

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: "top top",
          end: "+=160%",
          pin: true,
          scrub: 0.6,
        },
      });

      const perWord = 1 / WORD_COUNT;

      words.forEach((word, index) => {
        const start = index * perWord;
        // arrive: hidden -> huge, centered
        tl.fromTo(
          word,
          { opacity: 0, scale: 0.6, x: 0, y: 0 },
          { opacity: 1, scale: 1, x: 0, y: 0, duration: perWord * 0.55, ease: GSAP_LIQUID_EASE },
          start
        );
        // settle: huge -> small, moved to its row slot — either when the
        // next word arrives, or (for the last word) right after its own
        // arrival, so the scene always ends with all four settled.
        const settleAt = index < WORD_COUNT - 1 ? (index + 1) * perWord : start + perWord * 0.6;
        tl.to(
          word,
          { scale: 0.22, x: slots[index].x, y: slots[index].y, opacity: 0.55, duration: perWord * 0.4, ease: GSAP_LIQUID_EASE },
          settleAt
        );
      });
    }, scene);

    return () => ctx.revert();
  }, [reducedMotion, slots]);

  return (
    <section id="philosophy" className="px-6 max-w-[1600px] mx-auto scroll-mt-24">
      <div className="py-32">
        <Reveal variant="blur">
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Philosophie</p>
          <h2
            className="font-display text-kov-bone uppercase max-w-3xl"
            style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
          >
            Le bon design n&apos;a pas besoin de crier<span className="text-kov-red">.</span>
          </h2>
          <p className="mt-6 max-w-xl text-kov-concrete text-sm leading-relaxed">
            On construit des expériences numériques pour ceux qui ne veulent pas
            ressembler à tout le monde. Pas de template choisi avant la
            réflexion. Pas de banque d&apos;images pour remplir un espace. Pas
            de discours d&apos;agence interchangeable. Chaque projet commence
            par ce qui le rend différent — puis on construit autour de cette
            différence.
          </p>
        </Reveal>
      </div>

      {!reducedMotion && (
        <div ref={sceneRef} className="relative h-screen overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {PRINCIPLES.map((principle) => (
              <p
                key={principle.slug}
                data-word
                className="absolute font-display text-kov-bone uppercase whitespace-nowrap"
                style={{ fontSize: "var(--display-xl)", lineHeight: "var(--line-height-display)" }}
              >
                {principle.word}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="py-32">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 border-t pt-10" style={{ borderColor: "var(--kov-border)" }}>
          {PRINCIPLES.map((principle, index) => (
            <Reveal key={principle.slug} variant="blur" delay={0.15 + index * 0.08}>
              <h3 className="font-display text-kov-bone uppercase text-xl mb-2">{principle.word}</h3>
              <p className="text-kov-concrete text-sm leading-relaxed">{principle.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
