"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface StudioIntroProps {
  onEnter: () => void;
  ready: boolean;
  /** Real bytes-loaded percentage of the entry panorama (0-100), driven by
   * TextureLoader's own progress event — not a simulated/fake timer. */
  loadProgress: number;
  totalRooms: number;
  /** Entry node's own small thumbnail (already generated for
   * StudioRoomCarousel) — blurred behind the card so the backdrop is a real
   * glimpse of the room about to be entered, not a stock image, while
   * staying tiny to load (contrast with the multi-MB panorama itself). */
  backdropSrc: string;
  /** True during the "revealing" phase — fades this screen out in place
   * (via `animate`, while still mounted) so it cross-fades with the canvas
   * fading in underneath, rather than sitting opaque for the whole reveal
   * and popping away the instant it unmounts. An `exit` prop alone does
   * nothing here: this component was never wrapped in <AnimatePresence>,
   * so exit animations never actually played. */
  revealing: boolean;
  revealDurationMs: number;
}

// Cosmetic staging over the one real load event above (a single panorama
// fetch), not four separately-measured operations — same honest device as
// showing a qualitative "Optimisé" instead of a fake score elsewhere in the
// codebase: the underlying signal (loadProgress) is real, only the labels
// are narrative.
const LOADING_STEPS = [
  { label: "Chargement de l'environnement", threshold: 0 },
  { label: "Préparation du panorama", threshold: 30 },
  { label: "Synchronisation du studio", threshold: 65 },
  { label: "Finalisation des éléments interactifs", threshold: 90 },
];

// The very first thing /studio shows — no marketing Hero, just a two-step
// board (loading, then ready-to-enter) over a heavily blurred real glimpse
// of the room being prepared. `ready` gates which of the two card states
// renders: the panorama texture loads underneath this screen while it's
// still showing, so entering never reveals a half-loaded sphere.
export function StudioIntro({
  onEnter,
  ready,
  loadProgress,
  totalRooms,
  backdropSrc,
  revealing,
  revealDurationMs,
}: StudioIntroProps) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-8 overflow-hidden px-6"
      style={{ background: "#050505", zIndex: "var(--z-modal)" as unknown as number }}
      animate={{ opacity: revealing ? 0 : 1 }}
      transition={{ duration: revealDurationMs / 1000, ease: "easeInOut" }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={backdropSrc}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          style={{ filter: "blur(50px) brightness(0.4) saturate(1.2)", transform: "scale(1.2)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(55% 45% at 75% 40%, rgba(227,30,36,0.22), transparent 70%)" }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(5,5,5,0.5)" }} />
      </div>

      <div className="relative text-center">
        <p className="font-display text-kov-bone uppercase tracking-widest text-sm">KOV</p>
        <p className="text-kov-steel uppercase tracking-widest text-[10px] mt-2">Virtual Studio</p>
      </div>

      <div
        className="relative w-[440px] max-w-[90vw] p-8"
        style={{
          borderRadius: 20,
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow-full)",
        }}
      >
        <p className="absolute top-6 right-8 font-mono text-xs text-kov-steel">{ready ? "02" : "01"} / 02</p>

        {ready ? (
          <ReadyState onEnter={onEnter} totalRooms={totalRooms} />
        ) : (
          <LoadingState loadProgress={loadProgress} />
        )}
      </div>
    </motion.div>
  );
}

function LoadingState({ loadProgress }: { loadProgress: number }) {
  const activeStepIndex = LOADING_STEPS.reduce((acc, step, i) => (loadProgress >= step.threshold ? i : acc), 0);

  return (
    <div className="text-center">
      <div className="relative w-14 h-14 mx-auto mb-6 flex items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full animate-ping motion-reduce:animate-none"
          style={{ background: "var(--kov-red)", opacity: 0.2 }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(227,30,36,0.4)" }}
        />
        <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--kov-red)" }} />
      </div>

      <h2 className="font-display text-kov-bone uppercase text-lg">Initialisation du studio</h2>
      <p className="mt-2 text-kov-steel text-sm">Préparation de votre expérience immersive</p>

      <div className="mt-6">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${loadProgress}%`, background: "var(--kov-red)", transition: "width 0.25s ease" }}
          />
        </div>
        <p className="mt-2 text-right font-mono text-[11px] text-kov-steel">{Math.round(loadProgress)} %</p>
      </div>

      <ul className="mt-6 space-y-2.5 text-left">
        {LOADING_STEPS.map((step, i) => {
          const done = i < activeStepIndex;
          const active = i === activeStepIndex;
          return (
            <li
              key={step.label}
              className="flex items-center gap-3 text-xs"
              style={{ color: done || active ? "var(--kov-bone)" : "var(--kov-steel)" }}
            >
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: done ? "var(--kov-red)" : "transparent",
                  border: done ? "none" : `1px solid ${active ? "var(--kov-red)" : "var(--glass-border)"}`,
                }}
              />
              {step.label}
              {active && (
                <span aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
                  …
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReadyState({ onEnter, totalRooms }: { onEnter: () => void; totalRooms: number }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div
        aria-hidden="true"
        className="w-14 h-14 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ border: "1.5px solid var(--kov-red)", boxShadow: "0 0 24px rgba(227,30,36,0.35)" }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--kov-red)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="font-display text-kov-bone uppercase text-lg">Le studio est prêt</h2>
      <p className="mt-4 text-kov-steel text-sm leading-relaxed">
        Explorez les {totalRooms} espaces du KOV Virtual Studio et plongez dans un univers dédié à la création,
        l&apos;innovation et aux expériences sans limites.
      </p>

      <button
        type="button"
        onClick={onEnter}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 text-kov-bone text-xs uppercase tracking-widest transition-colors hover:text-kov-red-signal"
        style={{
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--kov-red)",
          background: "rgba(227,30,36,0.1)",
          boxShadow: "0 0 28px rgba(227,30,36,0.25)",
        }}
      >
        Entrer dans le studio
        <span aria-hidden="true">→</span>
      </button>

      <div className="mt-6 pt-5 grid grid-cols-3 gap-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
        <div>
          <p className="font-display text-kov-red text-sm">360°</p>
          <p className="mt-1 text-kov-steel text-[10px] uppercase tracking-widest leading-tight">
            Explorer en 360°
          </p>
        </div>
        <div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--kov-steel)"
            strokeWidth="1.6"
            className="mx-auto"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M15 9l-2.2 5.2L9 16l2.2-5.2z" fill="var(--kov-steel)" stroke="none" />
          </svg>
          <p className="mt-1 text-kov-steel text-[10px] uppercase tracking-widest leading-tight">
            Visite libre et intuitive
          </p>
        </div>
        <div>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--kov-steel)"
            strokeWidth="1.6"
            className="mx-auto"
          >
            <rect x="4" y="4" width="7" height="7" rx="1" />
            <rect x="13" y="4" width="7" height="7" rx="1" />
            <rect x="4" y="13" width="7" height="7" rx="1" />
            <rect x="13" y="13" width="7" height="7" rx="1" />
          </svg>
          <p className="mt-1 text-kov-steel text-[10px] uppercase tracking-widest leading-tight">
            {totalRooms} salles d&apos;expériences
          </p>
        </div>
      </div>
    </motion.div>
  );
}
