"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap, pinAndTrack, ScrollTrigger } from "@/lib/motion";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { ActivationSlider } from "@/components/home/ActivationSlider";
import { ActivationCard } from "@/components/home/ActivationCard";
import { RadarChart, PerformanceBars, ResponsiveBars, SecurityGauge } from "@/components/home/ActivationCharts";
import { PhotoPlaceholder, ResponsiveMedia } from "@/components/home/ActivationMedia";

// Once the drag completes, a brief pulse plays inside the window, then the
// activated content (below) cross-fades in — in place, inside the same
// window, rather than a separate page taking over the viewport.
const PULSE_DURATION = 850;

// Scroll distance (vh), split into three consecutive phases within one
// pinned runway: grow the window to fullscreen, wipe through the cards
// one at a time, then fade to black before releasing back to normal page
// flow.
const DIVE_VH = 150;
const CARDS_VH = 200;
const FADE_VH = 80;
const RUNWAY_VH = DIVE_VH + CARDS_VH + FADE_VH;
const DIVE_SPLIT = DIVE_VH / RUNWAY_VH;
const CARDS_SPLIT = (DIVE_VH + CARDS_VH) / RUNWAY_VH;

// Matches the card's own resting min-h-[640px] (md+) — the dive's 0%
// starting point for the interpolated min-height below.
const CARD_REST_HEIGHT = 640;

// Each card gets an equal-length "slot" within the cards phase (1 /
// CARDS.length, computed where CARDS is in scope below); within each slot
// (after the first) the previous card holds, then a diagonal wipe reveals
// this one over CARD_REVEAL_SPAN of the timeline, then it holds until the
// next slot's wipe begins.
const CARD_REVEAL_SPAN = 0.12;
// Percent-of-width horizontal offset between the wipe's top and bottom
// edge — what makes the cut diagonal instead of a plain vertical line.
const WIPE_SKEW = 16;

type Phase = "idle" | "activating" | "activated";

interface ActivationCardData {
  tag: string;
  title: string;
  body: string;
  features: string[];
  icon: ReactNode;
  Chart: ComponentType<{ reducedMotion: boolean }>;
  Media: ComponentType<{ reducedMotion: boolean }>;
}

const CARDS: ActivationCardData[] = [
  {
    tag: "Design",
    title: "Expérience unique",
    body: "Un design sur-mesure qui reflète votre identité.",
    features: ["Interfaces sur-mesure", "Direction artistique", "Motion design"],
    icon: <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z" />,
    Chart: RadarChart,
    Media: PhotoPlaceholder,
  },
  {
    tag: "Technique",
    title: "Performances",
    body: "Développé pour la vitesse, le SEO et la conversion.",
    features: ["Temps de chargement réduit", "Score SEO optimisé", "Parcours de conversion soigné"],
    icon: (
      <>
        <path d="M12 3l9 5-9 5-9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
    Chart: PerformanceBars,
    Media: PhotoPlaceholder,
  },
  {
    tag: "Adaptatif",
    title: "Responsive",
    body: "Parfait sur tous les écrans, partout, tout le temps.",
    features: ["Fluide sur tous les écrans", "Testé sur chaque appareil", "Une expérience cohérente"],
    icon: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </>
    ),
    Chart: ResponsiveBars,
    Media: ResponsiveMedia,
  },
  {
    tag: "Protection",
    title: "Sécurité",
    body: "Technologies modernes et protection avancée.",
    features: ["Chiffrement des données", "Hébergement sécurisé", "Mises à jour continues"],
    icon: <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />,
    Chart: SecurityGauge,
    Media: PhotoPlaceholder,
  },
];

// The section's own object: a premium macOS-style window (no fake address
// bar — this isn't a browser mock, it's KOV's own digital environment)
// holding a centered heading + the ActivationSlider. Once dragged past
// threshold: a brief pulse, then the SAME window's content swaps in place
// to the result (heading + the card sequence below) — one continuous
// window and one continuous background throughout, no fullscreen
// takeover.
// Independently, scrolling past the window pins it and runs it through
// three phases: grow to fullscreen, wipe through the cards one at a time
// (a diagonal reveal with a glowing red leading edge — user-chosen
// direction, see ActivationCard's sibling wipe layers below), fade to
// black — all gated on scroll position alone except the cards, which
// also need the slider activated first (there's nothing to wipe through
// otherwise).
export function ActivationWindow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runwayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const wipeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const edgeRefs = useRef<(SVGLineElement | null)[]>([]);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Pins the window (via CSS position:sticky on its wrapper below — the
  // sitewide convention for scroll-scrubbed sections, see @/lib/motion:
  // pin:false here, scroll progress only drives values, GSAP itself never
  // takes over positioning) and runs the three phases described above.
  // min-height (not height) on the card on purpose: it only ever needs to
  // grow toward fullscreen during the dive — the card sequence itself is
  // clipped and wiped in place, so it never pushes the window taller.
  useEffect(() => {
    if (reducedMotion) return;
    const runway = runwayRef.current;
    const card = cardRef.current;
    if (!runway || !card) return;

    const cardStagger = 1 / CARDS.length;

    const trigger = pinAndTrack(
      runway,
      (progress) => {
        const diveProgress = gsap.utils.clamp(0, 1, progress / DIVE_SPLIT);
        gsap.set(card, {
          width: `${92 + diveProgress * 8}%`,
          maxWidth: `calc(1440px + (100vw - 1440px) * ${diveProgress})`,
          minHeight: `calc(${CARD_REST_HEIGHT}px + (100vh - ${CARD_REST_HEIGHT}px) * ${diveProgress})`,
          borderRadius: `${28 * (1 - diveProgress)}px`,
        });

        const cardsProgress = gsap.utils.clamp(0, 1, (progress - DIVE_SPLIT) / (CARDS_SPLIT - DIVE_SPLIT));
        // i=0 has no wipe layer (it's the base, always fully visible
        // underneath); i=1..N-1 each wipe in over whatever came before,
        // one slot per card.
        for (let i = 1; i < CARDS.length; i++) {
          const wipeStart = i * cardStagger;
          const t = gsap.utils.clamp(0, 1, (cardsProgress - wipeStart) / CARD_REVEAL_SPAN);
          const center = t * (100 + WIPE_SKEW) - WIPE_SKEW;
          const topX = gsap.utils.clamp(0, 100, center + WIPE_SKEW / 2);
          const bottomX = gsap.utils.clamp(0, 100, center - WIPE_SKEW / 2);

          const wipe = wipeRefs.current[i];
          if (wipe) wipe.style.clipPath = `polygon(0% 0%, ${topX}% 0%, ${bottomX}% 100%, 0% 100%)`;

          const edge = edgeRefs.current[i];
          if (edge) {
            edge.setAttribute("x1", String(topX));
            edge.setAttribute("x2", String(bottomX));
            edge.style.opacity = t > 0.02 && t < 0.98 ? "1" : "0";
          }
        }

        const fadeProgress = gsap.utils.clamp(0, 1, (progress - CARDS_SPLIT) / (1 - CARDS_SPLIT));
        if (fadeRef.current) fadeRef.current.style.opacity = String(fadeProgress);
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
        // The visitor may have already scrolled past where the card wipes
        // sit before ever dragging the slider — those layers only just
        // mounted, so force ScrollTrigger to re-evaluate against the
        // current scroll position instead of waiting for the next scroll
        // event to move them off their default (fully clipped) state.
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
          padding, matching "prend toute la page" literally rather than
          just the section's own content width. */}
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
                  className="absolute inset-0 flex flex-col items-center px-8 md:px-16 py-10 text-center"
                >
                  <p className="text-xs uppercase tracking-widest text-kov-steel mb-4 shrink-0">Système activé</p>
                  <h3
                    className="font-display text-kov-bone uppercase max-w-2xl shrink-0"
                    style={{ fontSize: "clamp(26px, 3.2vw, 46px)", lineHeight: "var(--line-height-display)" }}
                  >
                    Un site ne devrait pas simplement exister.
                    <br />
                    <span className="text-kov-red">Il devrait réagir.</span>
                  </h3>

                  {/* One card at a time, big — later ones diagonally wipe
                      over earlier ones (clip-path, driven by the scroll
                      effect above) with a glowing red leading edge (the
                      <line>, half-clipped by the same polygon so it sits
                      exactly on the cut) rather than all four fading in
                      simultaneously or occupying a scrolling list. */}
                  <div className="relative w-full flex-1 overflow-hidden mt-8">
                    <div className="absolute inset-0 max-w-4xl mx-auto">
                      {CARDS.map((card, i) => {
                        const content = (
                          <ActivationCard
                            tag={card.tag}
                            title={card.title}
                            body={card.body}
                            features={card.features}
                            icon={card.icon}
                            chart={<card.Chart reducedMotion={reducedMotion} />}
                            media={<card.Media reducedMotion={reducedMotion} />}
                            reducedMotion={reducedMotion}
                          />
                        );
                        if (i === 0) {
                          return (
                            <div key={card.title} className="absolute inset-0" style={{ zIndex: 0 }}>
                              {content}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={card.title}
                            ref={(el) => {
                              wipeRefs.current[i] = el;
                            }}
                            className="absolute inset-0"
                            style={{ zIndex: i, clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" }}
                          >
                            {content}
                            <svg
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                              className="absolute inset-0 pointer-events-none"
                              style={{ overflow: "visible" }}
                              aria-hidden="true"
                            >
                              <line
                                ref={(el) => {
                                  edgeRefs.current[i] = el;
                                }}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="100"
                                stroke="var(--kov-red-signal)"
                                strokeWidth="0.5"
                                vectorEffect="non-scaling-stroke"
                                style={{ filter: "drop-shadow(0 0 8px var(--kov-red))", opacity: 0 }}
                              />
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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

          {/* Exit fade-to-black — the card is already fullscreen by the
              time this phase starts (dive always completes first), so
              covering its own bounds is equivalent to covering the whole
              viewport. Hands off to the page's own base background once
              the runway finishes scrolling and the sticky wrapper above
              releases — nothing else needed, that's just normal document
              flow resuming underneath. */}
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
