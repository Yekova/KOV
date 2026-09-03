"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap, initGsap, pinAndTrack } from "@/lib/motion";
import ColorBends from "@/components/home/ColorBendsLazy";

// Scroll room (vh) reserved after activation for the whole fullscreen
// sequence to play out — cards revealing, then the exit fade. Matches the
// scale of every other scroll-scrubbed scene in this codebase (100–450vh).
const RUNWAY_VH = 250;

// The exact palette the user supplied for ColorBends — used verbatim
// rather than substituted for KOV tokens, unlike most vendored color
// defaults this session: this was given as a literal, specific config to
// use, not a generic demo placeholder needing a brand substitution.
const COLORS = ["#ff2727", "#f9b9f7", "#740000"];

const CARDS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Expérience unique",
    body: "Un design sur-mesure qui reflète votre identité.",
    icon: <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4z" />,
  },
  {
    title: "Performances",
    body: "Développé pour la vitesse, le SEO et la conversion.",
    icon: (
      <>
        <path d="M12 3l9 5-9 5-9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
  },
  {
    title: "Responsive",
    body: "Parfait sur tous les écrans, partout, tout le temps.",
    icon: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </>
    ),
  },
  {
    title: "Sécurité",
    body: "Technologies modernes et protection avancée.",
    icon: <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />,
  },
];

function CardGrid({ getRef }: { getRef?: (i: number) => (el: HTMLDivElement | null) => void }) {
  return (
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
      {CARDS.map((card, i) => (
        <div
          key={card.title}
          ref={getRef?.(i)}
          className="p-5"
          style={{
            opacity: getRef ? 0 : 1,
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(12px)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--kov-red)" strokeWidth="1.6" className="mb-3">
            {card.icon}
          </svg>
          <p className="text-kov-bone text-sm uppercase tracking-wide mb-1">{card.title}</p>
          <p className="text-kov-steel text-xs leading-relaxed">{card.body}</p>
        </div>
      ))}
    </div>
  );
}

// Mounted once ActivationWindow's pulse finishes — a fullscreen (position:
// fixed, above even the nav — z-modal) takeover: ColorBends as the
// background, then further scrolling reveals the 4 feature cards
// (scroll-scrubbed via pinAndTrack, GSAP — the site's own established tool
// for exactly this, not a new dependency), then an exit fade hands back to
// normal page flow and the homepage's own shared LineWaves background
// (already page-level in page.tsx — this overlay just needs to stop
// covering it, not replace it).
export function ActivationFullscreen() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const exitFadeRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reducedMotion) return;
    const runway = runwayRef.current;
    if (!runway) return;
    initGsap();

    const trigger = pinAndTrack(
      runway,
      (progress) => {
        // Cards stagger in across the first ~55% of the runway, one every
        // 10% of progress, each with its own 20%-wide fade+rise window.
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const start = 0.05 + i * 0.1;
          const end = start + 0.2;
          const t = gsap.utils.clamp(0, 1, (progress - start) / (end - start));
          gsap.set(card, { opacity: t, y: 24 * (1 - t) });
        });

        // Last ~18% of the runway: fade everything to black, then drop the
        // overlay out of the way entirely so normal scroll/paint resumes
        // beneath it (the homepage's own LineWaves background, already
        // there the whole time, just uncovered again).
        const exitT = gsap.utils.clamp(0, 1, (progress - 0.82) / 0.18);
        exitFadeRef.current?.style.setProperty("opacity", String(exitT));
        const overlay = overlayRef.current;
        if (overlay) {
          const done = progress >= 0.999;
          overlay.style.opacity = done ? "0" : "1";
          overlay.style.pointerEvents = done ? "none" : "auto";
        }
      },
      { pin: false, end: `+=${RUNWAY_VH}%` }
    );

    return () => trigger.kill();
  }, [reducedMotion]);

  if (reducedMotion) {
    // No fullscreen takeover, no scroll dependency — the content simply
    // appears in normal flow, right where the window was, fully visible
    // immediately. Functional, not motion-driven.
    return (
      <div className="relative w-full flex flex-col items-center px-8 py-24" style={{ background: "var(--kov-black)" }}>
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Système activé</p>
        <h3
          className="font-display text-kov-bone uppercase text-center"
          style={{ fontSize: "clamp(26px, 3.2vw, 46px)", lineHeight: "var(--line-height-display)" }}
        >
          Un site ne devrait pas simplement exister.
          <br />
          <span className="text-kov-red">Il devrait réagir.</span>
        </h3>
        <CardGrid />
      </div>
    );
  }

  return (
    <div ref={runwayRef} style={{ height: `${100 + RUNWAY_VH}vh` }} className="relative">
      <div
        ref={overlayRef}
        className="fixed inset-0 overflow-hidden"
        style={{ zIndex: "var(--z-modal)", background: "var(--kov-black)" }}
      >
        <div className="absolute inset-0">
          <ColorBends
            rotation={90}
            speed={0.2}
            colors={COLORS}
            transparent
            autoRotate={0}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={1}
            parallax={0.5}
            noise={0.15}
            iterations={1}
            intensity={1.5}
            bandWidth={6}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div className="relative h-full w-full flex flex-col items-center justify-center px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Système activé</p>
          <h3
            className="font-display text-kov-bone uppercase"
            style={{ fontSize: "clamp(26px, 3.2vw, 46px)", lineHeight: "var(--line-height-display)" }}
          >
            Un site ne devrait pas simplement exister.
            <br />
            <span className="text-kov-red">Il devrait réagir.</span>
          </h3>

          <CardGrid
            getRef={(i) => (el) => {
              cardRefs.current[i] = el;
            }}
          />
        </div>

        <div ref={exitFadeRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "var(--kov-black)", opacity: 0 }} />
      </div>
    </div>
  );
}
