"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap, pinAndTrack, ScrollTrigger } from "@/lib/motion";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { Button } from "@/components/ui/Button";
import { ActivationSlider } from "@/components/home/ActivationSlider";
import { ActivationCard } from "@/components/home/ActivationCard";
import { RadarChart, GrowthBars, PerformanceGauge } from "@/components/home/ActivationCharts";
import { PhotoPlaceholder, ResponsiveMedia } from "@/components/home/ActivationMedia";

// Once the drag completes, a brief pulse plays inside the window, then the
// activated content (below) cross-fades in — in place, inside the same
// window, rather than a separate page taking over the viewport.
const PULSE_DURATION = 850;

// Scroll distance (vh), split into three consecutive phases within one
// pinned runway: grow the window to fullscreen, coverflow through the
// cards, then fade to black before releasing back to normal page flow.
const DIVE_VH = 150;
const CARDS_VH = 260;
const FADE_VH = 80;
const RUNWAY_VH = DIVE_VH + CARDS_VH + FADE_VH;
const DIVE_SPLIT = DIVE_VH / RUNWAY_VH;
const CARDS_SPLIT = (DIVE_VH + CARDS_VH) / RUNWAY_VH;

// Matches the card's own resting min-h-[640px] (md+) — the dive's 0%
// starting point for the interpolated min-height below.
const CARD_REST_HEIGHT = 640;

// Coverflow geometry — each unit of distance from the active card shifts
// it CARD_SPACING px sideways; scale/opacity/blur fall off with distance,
// clamped at 1 (i.e. cards 2+ away from active look the same as cards
// exactly 1 away don't get scaled/blurred further past that point).
const CARD_WIDTH = 250;
const CARD_HEIGHT = 445; // 9:16
const CARD_SPACING = 300;

type Phase = "idle" | "activating" | "activated";

interface ApproachCardData {
  title: string;
  body: string;
  features?: string[];
  Visual: ComponentType<{ reducedMotion: boolean; src?: string }>;
  mediaSrc?: string;
}

// Responsive stays 3rd per the reference spec's own order (Introduction →
// Design → Responsive → Performance → Accompagnement → Résultats) —
// noting this overrides an earlier request this session to lead with
// Responsive specifically, since this newer, more detailed spec is the
// most recent instruction.
const CARDS: ApproachCardData[] = [
  {
    title: "Une base solide",
    body: "Une stratégie claire pour un site qui a du sens.",
    Visual: PhotoPlaceholder, // mountain-peak photo — user-supplied later
  },
  {
    title: "Design sur mesure",
    body: "Une identité unique qui vous ressemble vraiment.",
    Visual: RadarChart,
  },
  {
    title: "Responsive par nature",
    body: "Une expérience parfaite sur tous les écrans, mobile, tablette, desktop.",
    Visual: ResponsiveMedia,
  },
  {
    title: "Performance durable",
    body: "Des sites rapides, optimisés et pensés pour la croissance.",
    features: ["Core Web Vitals", "SEO technique", "Chargement ultra-rapide", "Infrastructure fiable"],
    Visual: PerformanceGauge,
  },
  {
    title: "Un vrai accompagnement",
    body: "À vos côtés, de l'idée aux résultats, et bien au-delà.",
    Visual: PhotoPlaceholder, // two facing silhouettes — user-supplied later
  },
  {
    title: "Des résultats concrets",
    body: "Plus de visibilité. Plus d'engagement. Plus d'opportunités.",
    Visual: GrowthBars,
  },
];

// The section's own object: a premium macOS-style window (no fake address
// bar — this isn't a browser mock, it's KOV's own digital environment)
// holding a centered heading + the ActivationSlider. Once dragged past
// threshold: a brief pulse, then the SAME window's content swaps in place
// to the result — a sticky left column (title/pitch/CTAs, unaffected by
// the scroll below it) beside a coverflow of 6 cards on the right, one
// active (bigger, sharp, slightly raised) at a time as the visitor keeps
// scrolling, tracked by a numbered stepper.
// Independently, scrolling past the window pins it and runs it through
// three phases: grow to fullscreen, coverflow through the cards, fade to
// black — all gated on scroll position alone except the cards, which
// also need the slider activated first (there's nothing to browse
// otherwise).
export function ActivationWindow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runwayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const coverflowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Pins the window (via CSS position:sticky on its wrapper below — the
  // sitewide convention for scroll-scrubbed sections, see @/lib/motion:
  // pin:false here, scroll progress only drives values, GSAP itself never
  // takes over positioning) and runs the three phases described above.
  // min-height (not height) on the card on purpose: it only ever needs to
  // grow toward fullscreen during the dive — the coverflow below is
  // sized/positioned independently of the window's own box.
  useEffect(() => {
    if (reducedMotion) return;
    const runway = runwayRef.current;
    const card = cardRef.current;
    if (!runway || !card) return;

    const trigger = pinAndTrack(
      runway,
      (progress) => {
        const diveProgress = gsap.utils.clamp(0, 1, progress / DIVE_SPLIT);
        const rawFade = gsap.utils.clamp(0, 1, (progress - CARDS_SPLIT) / (1 - CARDS_SPLIT));
        const fadeProgress = rawFade * rawFade;
        gsap.set(card, {
          width: `${92 + diveProgress * 8}%`,
          maxWidth: `calc(1440px + (100vw - 1440px) * ${diveProgress})`,
          minHeight: `calc(${CARD_REST_HEIGHT}px + (100vh - ${CARD_REST_HEIGHT}px) * ${diveProgress})`,
          borderRadius: `${28 * (1 - diveProgress)}px`,
          scale: 1 - fadeProgress * 0.06,
        });
        if (fadeRef.current) fadeRef.current.style.opacity = String(fadeProgress);

        const cardsProgress = gsap.utils.clamp(0, 1, (progress - DIVE_SPLIT) / (CARDS_SPLIT - DIVE_SPLIT));
        const segment = cardsProgress * (CARDS.length - 1);

        CARDS.forEach((_, i) => {
          const el = coverflowRefs.current[i];
          if (!el) return;
          const distance = i - segment;
          const absDist = Math.min(1, Math.abs(distance));
          const scale = 1 - absDist * 0.22;
          const liftY = -(1 - absDist) * 12;
          const opacity = Math.abs(distance) > 3 ? 0 : 1 - absDist * 0.55;
          const blurPx = Math.min(8, Math.abs(distance) * 4);
          el.style.transform = `translate(-50%, -50%) translate(${distance * CARD_SPACING}px, ${liftY}px) scale(${scale})`;
          el.style.opacity = String(opacity);
          el.style.filter = blurPx > 0.05 ? `blur(${blurPx}px)` : "none";
          el.style.zIndex = String(Math.round(100 - Math.abs(distance) * 10));
        });
      },
      { pin: false, end: `+=${RUNWAY_VH}%` }
    );

    return () => trigger.kill();
  }, [reducedMotion]);

  function handleActivate() {
    if (reducedMotion) {
      setPhase("activated");
      return;
    }
    setPhase("activating");
    timers.current.push(
      setTimeout(() => {
        setPhase("activated");
        // The visitor may have already scrolled past where the coverflow
        // sits before ever dragging the slider — those card refs only
        // just mounted, so force ScrollTrigger to re-evaluate against the
        // current scroll position instead of waiting for the next scroll
        // event to position them.
        requestAnimationFrame(() => ScrollTrigger.update());
      }, PULSE_DURATION)
    );
  }

  return (
    <div ref={runwayRef} className="relative" style={{ height: `calc(100vh + ${RUNWAY_VH}vh)` }}>
      {/* position:sticky, not GSAP's own pin:true — the established
          sitewide convention for scroll-scrubbed sections (see
          @/lib/motion). Negative-margin full-bleed so the sticky viewport
          spans the true 100vw regardless of this section's own max-width/
          padding. */}
      <div
        className="sticky top-0 h-screen flex items-center justify-center overflow-hidden"
        style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)", width: "100vw" }}
      >
        <div
          ref={cardRef}
          className="relative w-[92vw] overflow-hidden min-h-[560px] md:min-h-[640px] flex flex-col"
          style={{
            maxWidth: 1440,
            borderRadius: 28,
            border: "1px solid var(--glass-border)",
            boxShadow: "var(--glass-shadow-full), 0 60px 120px -40px rgba(0,0,0,0.7)",
          }}
        >
          <Image src="/home/activation-background.webp" alt="" fill sizes="100vw" className="object-cover" />

          {/* Legibility scrim — a light, uniform dim so text stays readable
              against the image regardless of where its highlights sit. */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "rgba(5,5,5,0.35)" }} />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }} />

          <BrowserChrome className="relative shrink-0" showUrlBar={false} />

          <div className="relative flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {phase !== "activated" ? (
                <motion.div
                  key="idle"
                  animate={{ opacity: phase === "activating" ? 0.15 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 md:px-16"
                >
                  <h3
                    className="font-display text-kov-bone uppercase max-w-xl"
                    style={{ fontSize: "clamp(28px, 3.6vw, 52px)", lineHeight: "var(--line-height-display)" }}
                  >
                    Activez votre site
                    <br />
                    en un geste.
                  </h3>
                  <div className="mt-12 w-full flex justify-center">
                    <ActivationSlider onActivate={handleActivate} reducedMotion={reducedMotion} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="activated"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 flex px-8 md:px-14 py-10"
                >
                  {/* Left column — stays put; the coverflow to its right
                      is what the scroll effect above actually drives. */}
                  <div className="w-[30%] shrink-0 flex flex-col justify-center pr-8 text-left">
                    <div className="flex items-center gap-3 mb-5">
                      <span aria-hidden="true" className="w-1 shrink-0" style={{ height: 16, background: "var(--kov-red)" }} />
                      <p className="text-xs uppercase tracking-widest text-kov-steel">Notre approche</p>
                    </div>
                    <h3
                      className="font-display text-kov-bone uppercase mt-3"
                      style={{ fontSize: "clamp(24px, 2.4vw, 38px)", lineHeight: "var(--line-height-display)" }}
                    >
                      Un site qui
                      <br />
                      vous ressemble
                    </h3>
                    <p className="mt-5 text-kov-steel text-sm leading-relaxed max-w-sm">
                      Un site sur-mesure, pensé pour votre marque, vos objectifs et vos utilisateurs. Design,
                      performance et accompagnement : tout est réuni pour faire la différence.
                    </p>
                    <div className="mt-8 flex flex-col items-start gap-3">
                      <Button variant="primary" href="/contact">
                        Démarrer mon projet →
                      </Button>
                      <Button variant="secondary" href="/#work-gallery">
                        Voir nos réalisations ↗
                      </Button>
                    </div>
                    <div className="mt-auto pt-10">
                      <p className="text-[10px] uppercase tracking-widest text-kov-steel">
                        Des sites pour des marques qui comptent
                      </p>
                      <div aria-hidden="true" className="mt-3 h-px w-12" style={{ background: "var(--glass-border)" }} />
                      <p className="mt-3 font-display text-kov-bone text-sm tracking-widest">KOV</p>
                    </div>
                  </div>

                  {/* Right side — the coverflow. Under reducedMotion the
                      scroll effect above never runs (it bails out at the
                      top), so the absolute-positioned coverflow would
                      never get its transforms set at all — a plain
                      wrapping grid instead, every card simply visible, no
                      scroll-driven motion needed to see any of them. */}
                  {reducedMotion ? (
                    <div className="flex-1 min-w-0 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        {CARDS.map((card, i) => (
                          <div key={card.title} style={{ aspectRatio: "9 / 16" }}>
                            <ActivationCard
                              number={String(i + 1).padStart(2, "0")}
                              title={card.title}
                              body={card.body}
                              features={card.features}
                              visual={<card.Visual reducedMotion={reducedMotion} src={card.mediaSrc} />}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex-1 h-full min-w-0">
                      {CARDS.map((card, i) => (
                        <div
                          key={card.title}
                          ref={(el) => {
                            coverflowRefs.current[i] = el;
                          }}
                          className="absolute"
                          style={{ left: "50%", top: "50%", width: CARD_WIDTH, height: CARD_HEIGHT }}
                        >
                          <ActivationCard
                            number={String(i + 1).padStart(2, "0")}
                            title={card.title}
                            body={card.body}
                            features={card.features}
                            visual={<card.Visual reducedMotion={reducedMotion} src={card.mediaSrc} />}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Activation wash — radiates from roughly where the slider sits
              (now centered), propagating out across the window rather than
              flashing everywhere at once. */}
          {phase === "activating" && !reducedMotion && (
            <motion.div
              aria-hidden="true"
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                bottom: "18%",
                width: 60,
                height: 60,
                marginLeft: -30,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,77,77,0.9), rgba(227,30,36,0.3) 45%, transparent 70%)",
              }}
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 22, opacity: 0 }}
              transition={{ duration: PULSE_DURATION / 1000, ease: "easeOut" }}
            />
          )}

          {/* Exit fade-to-black — paired with the card's own scale-down
              (see the effect above) so the ending reads as the window
              closing, not just a color change. The card is already
              fullscreen by the time this phase starts (dive always
              completes first), so covering its own bounds is equivalent
              to covering the whole viewport. Hands off to the page's own
              base background (the fixed LineWaves canvas behind every
              homepage section, see page.tsx) once the runway finishes
              scrolling and the sticky wrapper above releases — nothing
              else needed, that's just normal document flow resuming
              underneath. */}
          <div
            ref={fadeRef}
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ background: "var(--kov-black)", opacity: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
