"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { KovCTA } from "@/components/ui/KovCTA";
import { gsap, initGsap, GSAP_LIQUID_EASE } from "@/lib/motion";

// The homepage's closing statement — every other section now runs a
// scrubbed GSAP scene of its own (converging pillars, settling words, a
// growing progress line, a staged case-study reveal); this one was still a
// plain Reveal fade, the one section left visibly flat by comparison. Same
// staged-beat pattern as WorkSpotlight (eyebrow → headline → body → CTAs →
// detail), not pinned — one composition, same reasoning WorkSpotlight and
// ProcessTimeline already use for not needing a held scene.
//
// The headline also no longer just repeats /contact's own H1 ("Un projet
// en tête ?") verbatim — this is the page saying it, not the form asking
// it, so it gets its own line.
export function ClosingCta() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const scene = sceneRef.current;
    if (!scene) return;
    initGsap();

    const eyebrow = scene.querySelector("[data-cta-eyebrow]");
    const headline = scene.querySelector("[data-cta-headline]");
    const body = scene.querySelector("[data-cta-body]");
    const actions = scene.querySelector("[data-cta-actions]");
    const detail = scene.querySelector("[data-cta-detail]");

    const ctx = gsap.context(() => {
      gsap.set([eyebrow, headline, body, actions, detail], { opacity: 0, y: 24 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: scene, start: "top 80%", end: "top 35%", scrub: 0.5 },
      });

      tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.12, ease: GSAP_LIQUID_EASE }, 0)
        .to(headline, { opacity: 1, y: 0, duration: 0.28, ease: GSAP_LIQUID_EASE }, 0.1)
        .to(body, { opacity: 1, y: 0, duration: 0.18, ease: GSAP_LIQUID_EASE }, 0.45)
        .to(actions, { opacity: 1, y: 0, duration: 0.15, ease: GSAP_LIQUID_EASE }, 0.68)
        .to(detail, { opacity: 1, y: 0, duration: 0.12, ease: GSAP_LIQUID_EASE }, 0.85);
    }, scene);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="contact" className="px-6 pt-32 max-w-[1600px] mx-auto scroll-mt-24">
      <div
        ref={sceneRef}
        className="border-t pt-20 flex flex-col items-start"
        style={{ borderColor: "var(--kov-border)" }}
      >
        <p data-cta-eyebrow className="text-xs uppercase tracking-widest text-kov-steel mb-4">
          Prochaine étape
        </p>

        <h2
          data-cta-headline
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
        >
          On commence quand vous voulez<span className="text-kov-red">.</span>
        </h2>

        <p data-cta-body className="mt-6 max-w-md text-kov-concrete text-sm leading-relaxed">
          Pas de brief interminable, pas de jargon, pas de promesse
          inutile — un premier échange pour comprendre le problème,
          définir une direction et savoir ce qu&apos;il faut construire.
        </p>

        <div data-cta-actions className="mt-10 flex flex-wrap items-center gap-6">
          <KovCTA href="/contact">Parler de mon projet</KovCTA>
          <Button href="/studio" variant="ghost">
            Explorer KOV →
          </Button>
        </div>

        <p data-cta-detail className="mt-12 text-kov-steel text-xs uppercase tracking-widest">
          Bordeaux, France
        </p>
      </div>
    </section>
  );
}
