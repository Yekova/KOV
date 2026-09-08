"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, pinAndTrack } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { KovCarousel } from "@/components/ui/KovCarousel";
import { ExpertiseCard } from "@/components/home/ExpertiseCard";
import {
  StrategyVisual,
  DesignVisual,
  DevelopmentVisual,
  MotionVisual,
  SystemsVisual,
  IntegrationVisual,
} from "@/components/home/ExpertiseVisuals";
import { PILLARS } from "@/data/expertisePillars";

// Scroll distance (vh) for the desktop reveal — own pinned runway,
// independent of ImmersiveShowcase's; this section just needs to be a
// complete, well-built section that appears next in normal scroll flow,
// its own fade-to-black isn't needed (the previous section's exit fade
// already handles the hand-off between the two).
const CARDS_VH = 220;

// In PILLARS order (Stratégie..Intégration) — matches the grid-area names
// and sizes below.
const VISUALS = [StrategyVisual, DesignVisual, DevelopmentVisual, MotionVisual, SystemsVisual, IntegrationVisual];
const GRID_AREAS = ["strategie", "design", "developpement", "motion", "systemes", "integration"];
const SIZES = ["sm", "lg", "md", "sm", "md", "wide"] as const;

const LEFT_COLUMN = (
  <>
    <h2
      className="font-display text-kov-bone uppercase"
      style={{ fontSize: "clamp(28px, 3vw, 44px)", lineHeight: "var(--line-height-display)" }}
    >
      Six expertises.
      <br />
      Une structure vivante.
    </h2>
    <p className="mt-6 text-kov-steel text-sm leading-relaxed max-w-sm">
      Des expertises complémentaires qui s&apos;assemblent pour donner vie à des expériences remarquables.
    </p>
    <p className="mt-4 text-kov-steel text-sm leading-relaxed max-w-sm">
      Stratégie, design, développement, motion, systèmes, intégration. Six disciplines, une même exigence : façonner
      le réel par le digital.
    </p>
    <div className="mt-8 flex flex-col items-start gap-3">
      <Button variant="primary" href="/expertise">
        Découvrir nos expertises →
      </Button>
      <Button variant="secondary" href="/contact">
        Parler à l&apos;équipe
      </Button>
    </div>
  </>
);

// A modular bento grid — one hero card (Design, red-accented) among five
// smaller/wider tiles — that builds up progressively as the visitor
// scrolls: each card fades/scales/rises into its own fixed grid position
// (not a literal reflow where cards slide between positions as siblings
// appear — no precedent for that in this codebase, see the plan's own
// note), and whichever was most recently revealed gets a brief "active"
// spotlight (red border/glow, slight scale) that hands off to the next
// as more of the grid builds, settling once the structure is complete.
// Mobile drops the grid for KovCarousel's existing drag/arrow one-at-a-
// time pattern instead — a bento layout doesn't survive a narrow viewport.
export function ExpertiseTeaser() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const runway = runwayRef.current;
    if (!runway) return;

    const trigger = pinAndTrack(
      runway,
      (progress) => {
        const revealProgress = progress * PILLARS.length;

        PILLARS.forEach((_, i) => {
          const el = cardRefs.current[i];
          if (!el) return;
          const t = gsap.utils.clamp(0, 1, revealProgress - i);
          el.style.opacity = String(t);
          el.style.transform = `translateY(${(1 - t) * 20}px) scale(${0.85 + t * 0.15})`;
        });

        // The last stretch settles every card back to resting size —
        // "structure complète, ensemble cohérent" — rather than leaving
        // one card permanently spotlighted.
        const nextActive = progress > 0.9 ? -1 : Math.min(PILLARS.length - 1, Math.floor(revealProgress));
        setActiveIndex((prev) => (prev === nextActive ? prev : nextActive));
      },
      { pin: false, end: `+=${CARDS_VH}%` }
    );

    return () => trigger.kill();
  }, [reducedMotion]);

  return (
    <section id="expertise" className="relative">
      {/* Desktop — pinned runway, sticky 2-column viewport. */}
      <div
        ref={runwayRef}
        className="relative hidden md:block"
        style={{ height: reducedMotion ? "auto" : `calc(100vh + ${CARDS_VH}vh)` }}
      >
        <div className="sticky top-0 h-screen flex items-center overflow-hidden px-6">
          <div className="w-full max-w-[1600px] mx-auto flex gap-12">
            <div className="w-[30%] shrink-0 flex flex-col justify-center">{LEFT_COLUMN}</div>

            <div
              className="flex-1 grid gap-4"
              style={{
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "1fr 1fr 0.6fr",
                gridTemplateAreas: `"strategie design design motion" "developpement developpement systemes systemes" "integration integration integration integration"`,
                height: "70vh",
              }}
            >
              {PILLARS.map((pillar, i) => {
                const Visual = VISUALS[i];
                return (
                  <div
                    key={pillar.slug}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    style={{ gridArea: GRID_AREAS[i], opacity: reducedMotion ? 1 : 0 }}
                  >
                    <ExpertiseCard pillar={pillar} visual={<Visual />} active={activeIndex === i} size={SIZES[i]} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile — no pinned runway, no grid: KovCarousel's existing
          drag/arrow one-at-a-time pattern instead. */}
      <div className="md:hidden px-6 py-24">
        {LEFT_COLUMN}
        <div className="mt-10">
          <KovCarousel
            items={PILLARS.map((pillar, i) => {
              const Visual = VISUALS[i];
              return (
                <div key={pillar.slug} style={{ aspectRatio: "9 / 16" }}>
                  <ExpertiseCard pillar={pillar} visual={<Visual />} active={false} size="lg" />
                </div>
              );
            })}
            labels={PILLARS.map((p) => p.title)}
          />
        </div>
      </div>
    </section>
  );
}
