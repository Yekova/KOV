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
// pinned runway: grow the window to fullscreen, scroll through the card
// list, then fade to black before releasing back to normal page flow.
const DIVE_VH = 150;
const CARDS_VH = 150;
const FADE_VH = 80;
const RUNWAY_VH = DIVE_VH + CARDS_VH + FADE_VH;
const DIVE_SPLIT = DIVE_VH / RUNWAY_VH;
const CARDS_SPLIT = (DIVE_VH + CARDS_VH) / RUNWAY_VH;

// Matches the card's own resting min-h-[640px] (md+) — the dive's 0%
// starting point for the interpolated min-height below.
const CARD_REST_HEIGHT = 640;

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
// to the result (heading + a vertical list of feature cards) — one
// continuous window and one continuous background throughout, no
// fullscreen takeover.
// Independently, scrolling past the window pins it and runs it through
// three phases: grow to fullscreen, scroll through the card list (a
// translateY driven by progress, clipped to the space below the heading —
// the cards are now big enough that only one or two fit on screen at
// once), fade to black — all gated on scroll position alone except the
// cards, which also need the slider activated first (there's nothing to
// scroll through otherwise).
export function ActivationWindow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runwayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const cardsViewportRef = useRef<HTMLDivElement>(null);
  const cardsListRef = useRef<HTMLDivElement>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Pins the window (via CSS position:sticky on its wrapper below — the
  // sitewide convention for scroll-scrubbed sections, see @/lib/motion:
  // pin:false here, scroll progress only drives values, GSAP itself never
  // takes over positioning) and runs the three phases described above.
  // min-height (not height) on the card on purpose: the activated state's
  // card list can legitimately need more room than this floor, and a hard
  // height would clip it — the list itself is clipped deliberately
  // (cardsViewportRef, overflow-hidden) and scrolled via translateY
  // instead, so its real height never affects the window's own size.
  useEffect(() => {
    if (reducedMotion) return;
    const runway = runwayRef.current;
    const card = cardRef.current;
    if (!runway || !card) return;

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

        const viewport = cardsViewportRef.current;
        const list = cardsListRef.current;
        if (viewport && list) {
          const cardsProgress = gsap.utils.clamp(0, 1, (progress - DIVE_SPLIT) / (CARDS_SPLIT - DIVE_SPLIT));
          const maxTranslate = Math.max(0, list.scrollHeight - viewport.clientHeight);
          gsap.set(list, { y: -maxTranslate * cardsProgress });
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
        // The visitor may have already scrolled past where the cards
        // viewport sits before ever dragging the slider — it only just
        // mounted, so force ScrollTrigger to re-evaluate against the
        // current scroll position instead of waiting for the next scroll
        // event to move the list off its default (untranslated) state.
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

                  {/* Clipped viewport onto the card list below — the list
                      itself is translated via scroll progress (see the
                      effect above) rather than each card fading in place,
                      since the cards are now big enough that stacking all
                      four in view at once wouldn't fit one screen. */}
                  <div ref={cardsViewportRef} className="relative w-full flex-1 overflow-hidden mt-8">
                    <div ref={cardsListRef} className="absolute inset-x-0 top-0 flex flex-col gap-6 max-w-3xl mx-auto">
                      {CARDS.map((card, i) => (
                        <ActivationCard
                          key={card.title}
                          tag={card.tag}
                          title={card.title}
                          body={card.body}
                          features={card.features}
                          icon={card.icon}
                          chart={<card.Chart reducedMotion={reducedMotion} />}
                          media={<card.Media reducedMotion={reducedMotion} />}
                          index={i}
                          reducedMotion={reducedMotion}
                        />
                      ))}
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
