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
  /** Entry node's pre-blurred backdrop (`<id>-blur.webp`, 640x360 with the
   * blur baked in by sharp). Deliberately not the sharp thumbnail under a
   * CSS `filter: blur(50px)`: blurring a full-screen element is a real
   * per-frame compositor cost, and it was being paid while this whole
   * screen cross-faded out over a live WebGL canvas. The same look, for
   * 2KB and no runtime work. */
  backdropSrc: string;
  /** Room code and name of the entry node — the backdrop is a real glimpse
   * of it, so it may as well say which room it is. */
  roomCode: string;
  roomName: string;
  /** True during the "revealing" phase — fades this screen out in place
   * (via `animate`, while still mounted) so it cross-fades with the canvas
   * fading in underneath, rather than sitting opaque for the whole reveal
   * and popping away the instant it unmounts. An `exit` prop alone does
   * nothing here: this component was never wrapped in <AnimatePresence>,
   * so exit animations never actually played. */
  revealing: boolean;
  revealDurationMs: number;
}

// Cosmetic staging over the one real load event underneath (a single
// panorama fetch), not separately-measured operations — the same honest
// device as showing a qualitative label instead of a fake score elsewhere
// in this codebase: `loadProgress` is real, only the wording is narrative.
// One line that changes, rather than the checklist this used to draw: four
// ticking rows implied four measured stages, and there has only ever been
// one.
const LOADING_STAGES = [
  { label: "Chargement de l'environnement", threshold: 0 },
  { label: "Préparation du panorama", threshold: 30 },
  { label: "Synchronisation du studio", threshold: 65 },
  { label: "Finalisation des éléments interactifs", threshold: 90 },
];

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// The loading screen is in the palette of the flight video's first frame,
// sampled from the file rather than guessed: a sea of white cloud under a
// pale blue sky. Every colour below is a real pixel out of that frame.
//
// It matters because this screen hands straight over to the video. Cutting
// from a near-black card to a white sky would be a flash in the face at the
// exact moment the experience is meant to open; matching them means the
// video simply starts moving.
//
// Re-pointing the tokens rather than rewriting every class is the same
// device ActivationCard uses to invert its six SVG charts: globals.css
// declares the palette with `@theme inline`, so `text-kov-bone` compiles to
// `color: var(--kov-bone)` and redefining it here cascades through the whole
// subtree. --kov-red is deliberately untouched — it is the one colour that
// reads on both grounds.
const SKY_TOKENS = {
  "--kov-bone": "#1b2733",
  "--kov-steel": "#5a6b7a",
  "--kov-concrete": "#3d4b59",
  "--glass-bg": "linear-gradient(160deg, rgba(255,255,255,0.74), rgba(255,255,255,0.52))",
  "--glass-border": "rgba(27,39,51,0.16)",
  "--glass-shadow-full":
    "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,0.35), 0 18px 50px rgba(52,73,94,0.22)",
} as React.CSSProperties;

// The very first thing /studio shows — no marketing hero, just a single
// card over a real, heavily blurred glimpse of the room being prepared.
// `ready` gates its two states: the panorama loads underneath while this is
// still up, so entering never reveals a half-loaded sphere.
export function StudioIntro({
  onEnter,
  ready,
  loadProgress,
  totalRooms,
  backdropSrc,
  roomCode,
  roomName,
  revealing,
  revealDurationMs,
}: StudioIntroProps) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-7 overflow-hidden px-6"
      style={{ ...SKY_TOKENS, background: "#c5d1d9", zIndex: "var(--z-modal)" as unknown as number }}
      animate={{ opacity: revealing ? 0 : 1, scale: revealing ? 1.015 : 1 }}
      transition={{ duration: revealDurationMs / 1000, ease: EASE_OUT }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={backdropSrc}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          // Already blurred in the file; the scale only hides the softened
          // edges an upscale leaves behind.
          style={{ transform: "scale(1.08)" }}
        />
        {/* A pale scrim rather than the dark one this used to carry: enough
            to settle the cloud detail under the card without washing the sky
            out. The red radial that was here is gone — a red glow over a
            white sky reads as a colour cast, not as an accent. */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(232,238,243,0.30), rgba(186,199,211,0.58))" }}
        />
      </div>

      {/* This lockup is the page's title, so it is the page's <h1>.
          /studio had no h1 at all and went straight to <h2> — the two lines
          were <p> elements picked for how big they render, which is what CSS
          is for, not HTML. Same two lines, same classes, same pixels: the
          only change is that the document now says what its subject is.
          Nothing is hidden and nothing is added for a crawler's benefit —
          this text is on screen the moment the page opens. */}
      <h1 className="relative text-center">
        <span className="block font-display text-kov-bone uppercase tracking-[0.35em] text-sm">KOV</span>
        <span className="block text-kov-steel uppercase tracking-[0.3em] text-[9px] mt-2">Virtual Studio</span>
      </h1>

      <motion.div
        className="relative w-[420px] max-w-[92vw] p-7 flex flex-col"
        style={{
          borderRadius: 18,
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow-full)",
          // Fixed body height so the card doesn't resize under the visitor
          // when the loading state gives way to the ready state.
          minHeight: 268,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-kov-steel text-[9px] uppercase tracking-[0.25em] truncate">
            <span className="text-kov-red font-mono">{roomCode}</span>
            <span className="mx-2 opacity-40">/</span>
            {roomName}
          </p>
          <p className="font-mono text-[10px] text-kov-steel shrink-0">{ready ? "02" : "01"} — 02</p>
        </div>

        <div
          aria-hidden="true"
          className="mt-4 mb-6 h-px w-full shrink-0"
          style={{ background: "var(--glass-border)" }}
        />

        {ready ? (
          <ReadyState onEnter={onEnter} totalRooms={totalRooms} />
        ) : (
          <LoadingState loadProgress={loadProgress} />
        )}
      </motion.div>
    </motion.div>
  );
}

function LoadingState({ loadProgress }: { loadProgress: number }) {
  const stage = LOADING_STAGES.reduce((acc, s, i) => (loadProgress >= s.threshold ? i : acc), 0);
  const pct = Math.round(loadProgress);

  return (
    <motion.div
      className="flex flex-col flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="font-display text-kov-bone uppercase text-xl leading-tight">Initialisation du studio</h2>
      <p className="mt-2.5 text-kov-steel text-[13px] leading-relaxed">
        Préparation de votre visite immersive.
      </p>

      <div className="flex-1 min-h-6" />

      {/* The progress is the whole point of this state, so it gets the
          weight: a large tabular figure over a full-width rule. */}
      <div className="flex items-end justify-between gap-4 mb-2.5">
        <p className="text-kov-steel text-[10px] uppercase tracking-[0.2em] leading-snug">
          {LOADING_STAGES[stage].label}
        </p>
        <p
          className="font-mono text-kov-bone text-2xl leading-none shrink-0"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {pct}
          <span className="text-kov-steel text-sm ml-0.5">%</span>
        </p>
      </div>
      <div className="h-[3px] w-full overflow-hidden" style={{ background: "rgba(27,39,51,0.13)", borderRadius: 2 }}>
        <div
          className="h-full"
          style={{
            width: `${loadProgress}%`,
            background: "var(--kov-red)",
            borderRadius: 2,
            transition: "width 0.3s cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>
    </motion.div>
  );
}

function ReadyState({ onEnter, totalRooms }: { onEnter: () => void; totalRooms: number }) {
  return (
    <motion.div
      className="flex flex-col flex-1"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      <h2 className="font-display text-kov-bone uppercase text-xl leading-tight">Le studio est prêt</h2>
      <p className="mt-2.5 text-kov-steel text-[13px] leading-relaxed">
        {totalRooms} espaces à parcourir librement, en 360°. Prenez le temps de regarder autour de vous.
      </p>

      <div className="flex-1 min-h-6" />

      <button
        type="button"
        onClick={onEnter}
        className="group w-full flex items-center justify-center gap-2.5 py-3.5 text-kov-white text-[11px] uppercase tracking-[0.2em] transition-colors"
        style={{
          borderRadius: "var(--radius-pill)",
          // Solid, not a 10% tint. This is the single action the screen
          // exists for; it should look like it.
          background: "var(--kov-red)",
          boxShadow: "0 8px 30px rgba(227,30,36,0.3)",
        }}
      >
        Entrer dans le studio
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </button>

      {/* Text, not icons. A compass and a 2x2 grid said nothing these three
          words don't say better. */}
      <div className="mt-4 flex items-center justify-center gap-3 text-kov-steel text-[9px] uppercase tracking-[0.2em]">
        <span>{totalRooms} salles</span>
        <span aria-hidden="true" className="w-px h-2.5" style={{ background: "var(--glass-border)" }} />
        <span>Vue 360°</span>
        <span aria-hidden="true" className="w-px h-2.5" style={{ background: "var(--glass-border)" }} />
        <span>Visite libre</span>
      </div>
    </motion.div>
  );
}
