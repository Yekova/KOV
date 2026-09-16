"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { gsap, initGsap, pinAndTrack, motion as motionTiming, GSAP_REVEAL_EASE } from "@/lib/motion";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { Button } from "@/components/ui/Button";
import { ActivationCard } from "@/components/home/ActivationCard";
import { ActivationBackdrop } from "@/components/home/ActivationBackdrop";
import { RadarChart, GrowthBars, PerformanceGauge, FoundationStack, DeviceFrames, JourneyPath } from "@/components/home/ActivationCharts";

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
const CARD_WIDTH = 320;
const CARD_HEIGHT = 500;
const CARD_SPACING = 356;
// Cards are read as objects now, so they barely shrink and barely blur —
// the brief's point being that you should still be able to tell what the
// neighbours contain. Depth comes from the slight turn instead.
const NEIGHBOUR_SCALE_FALLOFF = 0.13;
const NEIGHBOUR_OPACITY_FALLOFF = 0.42;
const NEIGHBOUR_BLUR_MAX = 3;
const NEIGHBOUR_TURN_DEG = 4;
const ACTIVE_SCALE = 1.05;

interface ApproachCardData {
  title: string;
  body: string;
  features?: string[];
  Visual: ComponentType<{ reducedMotion: boolean; active: boolean }>;
  /** A real destination for this card's topic — an actual /expertise
   * pillar, the real work gallery, or /contact. Omitted for the one card
   * ("Un vrai accompagnement") with no single obvious page to point at,
   * rather than forcing a link that doesn't really fit. */
  href?: string;
}

// Responsive stays 3rd per the reference spec's own order (Introduction →
// Design → Responsive → Performance → Accompagnement → Résultats). Every
// visual is now a pure abstract/graphic composition (no photo, no video) —
// by request, so a stock-photo-shaped gap doesn't sit next to five real
// design pieces.
const CARDS: ApproachCardData[] = [
  {
    title: "Une base solide",
    body: "Une stratégie claire pour un site qui a du sens.",
    Visual: FoundationStack,
    href: "/expertise#strategie",
  },
  {
    title: "Design sur mesure",
    body: "Une identité unique qui vous ressemble vraiment.",
    Visual: RadarChart,
    href: "/expertise#design",
  },
  {
    title: "Responsive par nature",
    body: "Une expérience parfaite sur tous les écrans, mobile, tablette, desktop.",
    Visual: DeviceFrames,
    href: "/expertise#developpement",
  },
  {
    title: "Performance durable",
    body: "Des sites rapides, optimisés et pensés pour la croissance.",
    features: ["Core Web Vitals", "SEO technique", "Chargement ultra-rapide", "Infrastructure fiable"],
    Visual: PerformanceGauge,
    href: "/expertise#systemes",
  },
  {
    title: "Un vrai accompagnement",
    body: "À vos côtés, de l'idée aux résultats, et bien au-delà.",
    Visual: JourneyPath,
  },
  {
    title: "Des résultats concrets",
    body: "Plus de visibilité. Plus d'engagement. Plus d'opportunités.",
    Visual: GrowthBars,
    href: "/#work-gallery",
  },
];

// A premium macOS-style window (no fake address bar — this isn't a
// browser mock, it's KOV's own digital environment) holding a sticky left
// column (title/pitch/CTAs) beside a coverflow of 6 cards on the right,
// one active (bigger, sharp, slightly raised) at a time as the visitor
// scrolls. No manual "activate" gate anymore (removed by request — the
// drag-to-unlock slider didn't land well): the coverflow is live from the
// moment this scrolls into view, driven purely by scroll position, same
// as every other scroll-scrubbed section on the site.
// Scrolling past the window pins it and runs it through three phases:
// grow to fullscreen, coverflow through the cards, fade to black.
export function ActivationWindow() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const coverflowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  // Which card currently reads as "active" — a real React state (not just
  // an imperative style), so ActivationCard's border/glow and each chart's
  // replay-on-focus (see ActivationCharts.tsx) can react to it via props
  // instead of only ever being driven by inline transforms. Updated from
  // inside the scroll callback below, guarded against redundant re-renders
  // (every scroll frame recomputes `segment`, but the *rounded* active
  // index only actually changes a few times across the whole runway).
  const [activeIndex, setActiveIndex] = useState(0);
  const lastActiveIndexRef = useRef(0);
  // One card at a time on a narrow screen: same geometry, smaller numbers,
  // so the neighbours fall outside the frame instead of crowding it. Read
  // once — which card size to use is not something that needs to react to a
  // live resize mid-scroll.
  const [compact] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const cardW = compact ? 228 : CARD_WIDTH;
  const cardH = compact ? 396 : CARD_HEIGHT;
  const cardGap = compact ? 262 : CARD_SPACING;

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

        const roundedActive = Math.round(segment);
        if (roundedActive !== lastActiveIndexRef.current) {
          lastActiveIndexRef.current = roundedActive;
          setActiveIndex(roundedActive);
        }

        CARDS.forEach((_, i) => {
          const el = coverflowRefs.current[i];
          if (!el) return;
          const distance = i - segment;
          const absDist = Math.min(1, Math.abs(distance));
          const scale = ACTIVE_SCALE - absDist * NEIGHBOUR_SCALE_FALLOFF;
          const liftY = -(1 - absDist) * 12;
          const opacity = Math.abs(distance) > 3 ? 0 : 1 - absDist * NEIGHBOUR_OPACITY_FALLOFF;
          const blurPx = Math.min(NEIGHBOUR_BLUR_MAX, Math.abs(distance) * 1.6);
          // A few degrees of turn away from the viewer, signed so the cards
          // on either side lean back and only the active one faces front.
          // The parent carries the perspective; without it rotateY is a
          // no-op flatten.
          const turn = -gsap.utils.clamp(-1, 1, distance) * NEIGHBOUR_TURN_DEG;
          el.style.transform =
            `translate(-50%, -50%) translate(${distance * cardGap}px, ${liftY}px) ` +
            `rotateY(${turn}deg) scale(${scale})`;
          el.style.opacity = String(opacity);
          el.style.filter = blurPx > 0.05 ? `blur(${blurPx}px)` : "none";
          el.style.zIndex = String(Math.round(100 - Math.abs(distance) * 10));
        });
      },
      { pin: false, end: `+=${RUNWAY_VH}%` }
    );

    return () => trigger.kill();
  }, [reducedMotion, cardGap]);

  // One-time arrival as the window scrolls into view — a separate tween
  // on entranceRef (not cardRef), which the effect above owns exclusively
  // for its own continuous per-frame width/maxWidth/minHeight/scale sets;
  // keeping them on different elements means the two never fight over the
  // same inline style.
  useEffect(() => {
    if (reducedMotion) return;
    const el = entranceRef.current;
    if (!el) return;
    initGsap();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 60, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: motionTiming.slow,
          ease: GSAP_REVEAL_EASE,
          scrollTrigger: { trigger: el, start: "top bottom", toggleActions: "play none none reverse" },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [reducedMotion]);

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
        <div ref={entranceRef} className="w-full flex justify-center">
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
            {/* Pure CSS, no photo — matching the direction the six cards'
                own visuals took. The arcs at top and bottom are still dark
                voids baked into the same stack, so the card genuinely
                curves out of the page rather than wearing a separate cap.
                What changed is that the colour now moves, and that the
                whole thing is no longer inverted: see ActivationBackdrop. */}
            <ActivationBackdrop reducedMotion={reducedMotion} />

            <BrowserChrome className="relative shrink-0" showUrlBar={false} />

            <div className="relative flex-1 overflow-hidden flex px-8 md:px-14 py-10">
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

                {/* Progress indicator — reflects the real activeIndex state
                    driven by scroll (see the effect above), not decorative:
                    hidden under reducedMotion since that state never moves
                    there (the scroll effect bails out entirely). */}
                {!reducedMotion && (
                  <div className="flex items-center gap-2 mt-8" aria-hidden="true">
                    {CARDS.map((card, i) => (
                      <span
                        key={card.title}
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: i === activeIndex ? 20 : 6,
                          background: i === activeIndex ? "var(--kov-red)" : "var(--glass-border)",
                        }}
                      />
                    ))}
                  </div>
                )}

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
                  top), so the absolute-positioned coverflow would never
                  get its transforms set at all — a plain wrapping grid
                  instead, every card simply visible, no scroll-driven
                  motion needed to see any of them. */}
              {reducedMotion ? (
                <div className="flex-1 min-w-0 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    {CARDS.map((card, i) => (
                      <div key={card.title} style={{ aspectRatio: "9 / 16" }}>
                        <ActivationCard
                          number={String(i + 1).padStart(2, "0")}
                          total={CARDS.length}
                          title={card.title}
                          body={card.body}
                          features={card.features}
                          href={card.href}
                          visual={<card.Visual reducedMotion={reducedMotion} active={false} />}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative flex-1 h-full min-w-0" style={{ perspective: 1400 }}>
                  {CARDS.map((card, i) => (
                    <div
                      key={card.title}
                      ref={(el) => {
                        coverflowRefs.current[i] = el;
                      }}
                      className="absolute"
                      style={{ left: "50%", top: "50%", width: cardW, height: cardH }}
                    >
                      <ActivationCard
                        number={String(i + 1).padStart(2, "0")}
                        total={CARDS.length}
                        title={card.title}
                        body={card.body}
                        features={card.features}
                        href={card.href}
                        active={i === activeIndex}
                        visual={<card.Visual reducedMotion={reducedMotion} active={i === activeIndex} />}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exit fade-to-black — paired with the card's own scale-down
                (see the effect above) so the ending reads as the window
                closing, not just a color change. The card is already
                fullscreen by the time this phase starts (dive always
                completes first), so covering its own bounds is equivalent
                to covering the whole viewport. */}
            <div
              ref={fadeRef}
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ background: "var(--kov-black)", opacity: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
