"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { PROCESS } from "@/data/processSteps";
import { gsap, initGsap } from "@/lib/motion";

// The brief's §19 asks for the progress line itself to fill in as you
// scroll — "●─────── 01 / ●●────── 02 / ●●●───── 03." Rather than pinning
// (seven items don't need a dedicated held scene the way six converging
// discs or four huge words do), the timeline stays in normal scroll flow —
// each step still reveals via Reveal as it always did — and a single
// scrubbed GSAP timeline (tied to the section's natural scroll range, not
// a pin) grows a red line over the existing grey connector and lights up
// each dot as the line reaches it.
//
// Body text stays plain (no Liquid Glass wrapper per step) rather than the
// brief's "cartes Liquid Glass" suggestion — glass on all seven items in a
// row would be exactly the "toute la page en verre" over-application §2
// warns against for a UI element that's just... text, not something
// interactive or contextual.
export function ProcessTimeline() {
  const listRef = useRef<HTMLOListElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const list = listRef.current;
    const progressLine = progressRef.current;
    if (!list || !progressLine) return;
    initGsap();

    const dots = list.querySelectorAll<HTMLElement>("[data-step-dot]");

    const ctx = gsap.context(() => {
      gsap.set(progressLine, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(dots, { opacity: 0.35, scale: 0.85 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: list,
          start: "top 70%",
          end: "bottom 55%",
          scrub: 0.5,
        },
      });

      tl.to(progressLine, { scaleX: 1, ease: "none" }, 0);

      dots.forEach((dot, index) => {
        const at = index / (PROCESS.length - 1);
        tl.to(dot, { opacity: 1, scale: 1.2, duration: 0.06, ease: "none" }, at).to(
          dot,
          { scale: 1, duration: 0.06, ease: "none" },
          at + 0.06
        );
      });
    }, list);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="process" className="px-6 py-32 max-w-[1600px] mx-auto scroll-mt-24">
      <Reveal>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Processus</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Sept étapes<span className="text-kov-red">.</span> Pas de boîte noire<span className="text-kov-red">.</span>
        </h2>
        <p className="mt-6 mb-20 max-w-xl text-kov-concrete text-sm leading-relaxed">
          Un projet ne doit jamais disparaître derrière un écran jusqu&apos;à
          sa livraison. Chaque étape est visible, discutée et construite avec
          vous.
        </p>
      </Reveal>

      <ol ref={listRef} className="relative flex flex-col md:flex-row md:items-start justify-between gap-10 md:gap-6">
        <div className="hidden md:block absolute top-1.5 left-0 right-0 h-px" style={{ background: "var(--kov-border)" }} />
        {!reducedMotion && (
          <div ref={progressRef} className="hidden md:block absolute top-1.5 left-0 right-0 h-px" style={{ background: "var(--kov-red)" }} />
        )}
        {PROCESS.map((step, index) => (
          <Reveal
            key={step.number}
            as="li"
            delay={index * 0.06}
            className="relative flex md:flex-col items-start gap-3 md:gap-4 md:flex-1"
          >
            <span data-step-dot className="w-3 h-3 rounded-full bg-kov-red shrink-0 mt-1 md:mt-0" />
            <div>
              <p className="text-kov-red font-mono text-xs mb-1">{step.number}</p>
              <p className="font-display text-kov-bone uppercase text-sm mb-2">{step.title}</p>
              <p className="text-kov-steel text-xs leading-relaxed max-w-[16rem]">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
