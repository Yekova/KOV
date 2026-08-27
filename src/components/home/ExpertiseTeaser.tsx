"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PILLARS } from "@/data/expertisePillars";
import { gsap, initGsap, GSAP_LIQUID_EASE } from "@/lib/motion";

// Six points on a circle, starting at 12 o'clock, clockwise — one per
// pillar. Radius scales with viewport width (capped at 260px) — at a fixed
// 260px the left/right chips land off-screen past ~500px wide, since half
// that viewport is narrower than the radius itself.
function getArcPositions(radius: number) {
  return PILLARS.map((_, index) => {
    const angle = (-90 + index * 60) * (Math.PI / 180);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

// The "six disciplines converge into one system" scene from the brief:
// pinned for a scroll span, the six pillars appear as compact chips around
// a circle, then pull into the center as a single "Un seul système." label
// scales up in their place. Below it (always in normal flow, never pinned)
// the exact same six pillars render as a plain, fully readable grid with
// their real body copy — the pinned scene is the "wow" beat, the grid
// underneath is the "information" beat KOV-MOTION.md's rhythm rule asks
// for, and it's what prefers-reduced-motion / no-JS users see on its own.
//
// Reduced motion skips the pinned scene entirely rather than showing it
// without motion — a converge animation with the motion removed is just
// six overlapping chips, not a usable fallback.
export function ExpertiseTeaser() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [arcRadius] = useState(() => (typeof window !== "undefined" ? Math.min(260, window.innerWidth * 0.26) : 260));
  const arcPositions = getArcPositions(arcRadius);

  useEffect(() => {
    if (reducedMotion) return;
    const scene = sceneRef.current;
    if (!scene) return;
    initGsap();

    const chips = scene.querySelectorAll<HTMLElement>("[data-chip]");
    const converged = scene.querySelector<HTMLElement>("[data-converged-label]");

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scene,
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: 0.6,
        },
      });

      tl.set(chips, { opacity: 0, scale: 0.7 })
        .set(converged, { opacity: 0, scale: 0.85 })
        .to(chips, { opacity: 1, scale: 1, stagger: 0.08, duration: 0.4, ease: GSAP_LIQUID_EASE }, 0)
        .to(chips, { x: 0, y: 0, opacity: 0, scale: 0.4, stagger: 0.04, duration: 0.4, ease: GSAP_LIQUID_EASE }, 0.65)
        .to(converged, { opacity: 1, scale: 1, duration: 0.35, ease: GSAP_LIQUID_EASE }, 0.75);
    }, scene);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="expertise" className="px-6 max-w-[1600px] mx-auto scroll-mt-24">
      <div className="py-32">
        <Reveal>
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Expertise</p>
          <h2
            className="font-display text-kov-bone uppercase max-w-3xl"
            style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
          >
            Six disciplines<span className="text-kov-red">.</span> Un seul système<span className="text-kov-red">.</span>
          </h2>
          <p className="mt-6 max-w-xl text-kov-concrete text-sm leading-relaxed">
            Stratégie, design, développement, motion, systèmes et intégration ne
            sont pas six prestations séparées. Chez KOV, elles sont pensées
            ensemble, de la première décision jusqu&apos;à la mise en ligne — puis à
            l&apos;évolution du produit. Chaque discipline nourrit la suivante ;
            aucune ne travaille en vase clos.
          </p>
        </Reveal>
      </div>

      {!reducedMotion && (
        <div ref={sceneRef} className="relative h-screen overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {PILLARS.map((pillar, index) => (
              <div
                key={pillar.slug}
                data-chip
                className="absolute flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 border"
                style={{
                  transform: `translate(${arcPositions[index].x}px, ${arcPositions[index].y}px)`,
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                  borderColor: "var(--glass-border)",
                  borderRadius: "var(--radius-pill)",
                  boxShadow: "var(--glass-shadow-full)",
                }}
              >
                <span className="text-kov-red font-mono text-[10px] md:text-xs">{pillar.number}</span>
                <span className="font-display text-kov-bone uppercase text-xs md:text-sm whitespace-nowrap">{pillar.title}</span>
              </div>
            ))}

            <p
              data-converged-label
              className="absolute font-display text-kov-bone uppercase text-center"
              style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
            >
              Un seul
              <br />
              système<span className="text-kov-red">.</span>
            </p>
          </div>
        </div>
      )}

      <div className="py-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 border-t pt-10" style={{ borderColor: "var(--kov-border)" }}>
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.slug} delay={0.1 + index * 0.06}>
              <p className="text-kov-red font-mono text-xs mb-3">{pillar.number}</p>
              <h3 className="font-display text-kov-bone uppercase text-xl mb-2">{pillar.title}</h3>
              <p className="text-kov-concrete text-sm leading-relaxed">{pillar.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <Button href="/expertise" variant="secondary" className="mt-16">
            Voir l&apos;expertise →
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
