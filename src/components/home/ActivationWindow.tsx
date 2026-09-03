"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { ActivationSlider } from "@/components/home/ActivationSlider";
import "./ActivationWindow.css";

// Timing for the post-activation choreography — pulse plays, then the
// window fades to black, then (still hidden behind full black) the intro
// content is swapped for the activated content, then black dissolves away
// to reveal it. Content's own staggered reveal (eyebrow/title/cards) uses
// the exact 200/350/550/650/750/850ms marks requested, timed from the
// moment it mounts — which overlaps the tail of the black fade-out on
// purpose, so the reveal reads as one continuous cinematic beat rather
// than two separate transitions stitched together.
const PULSE_DURATION = 850;
const BLACK_FADE_IN = 350;
const BLACK_FADE_OUT = 550;

type Phase = "idle" | "activating" | "activated";

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

// The section's own object: a premium macOS-style window (no fake address
// bar — this isn't a browser mock, it's KOV's own digital environment)
// whose content transforms in place: an editorial intro + the
// ActivationSlider, then — once dragged past threshold — a radial pulse,
// a black cinematic fade, and the SAME window reveals a heading + 4
// feature cards. No navigation, no separate section, matching the "same
// window transforms" requirement directly.
export function ActivationWindow() {
  const windowRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [blackOpacity, setBlackOpacity] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const el = windowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  function handleActivate() {
    setPhase("activating");
    timers.current.push(
      setTimeout(() => setBlackOpacity(1), PULSE_DURATION),
      setTimeout(() => {
        setPhase("activated");
        setBlackOpacity(0);
      }, PULSE_DURATION + BLACK_FADE_IN)
    );
  }

  return (
    <div
      ref={windowRef}
      onPointerMove={handlePointerMove}
      className="relative w-[92vw] sm:w-[86vw] max-w-[1440px] mx-auto overflow-hidden min-h-[560px] md:min-h-[640px]"
      style={{
        borderRadius: 28,
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow-full), 0 60px 120px -40px rgba(0,0,0,0.7)",
      }}
    >
      {/* Liquid background — near-black base + two slow-drifting red blobs,
          red kept to a minority of the visual weight throughout. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 30% 15%, var(--kov-carbon), var(--kov-black) 65%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute activation-liquid-blob-1"
        style={{ inset: "-20%", background: "radial-gradient(circle at 70% 55%, rgba(227,30,36,0.22), transparent 55%)", filter: "blur(70px)" }}
      />
      <div
        aria-hidden="true"
        className="absolute activation-liquid-blob-2"
        style={{ inset: "-20%", background: "radial-gradient(circle at 20% 80%, rgba(255,77,77,0.12), transparent 50%)", filter: "blur(80px)" }}
      />

      {/* Smoked-glass sheet over the liquid background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
          backdropFilter: "blur(var(--glass-blur)) saturate(160%)",
          WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(160%)",
        }}
      />
      {/* Cursor-reactive highlight — light shifts, the window itself never tilts */}
      {!reducedMotion && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at var(--mx, 50%) var(--my, 30%), rgba(255,255,255,0.06), transparent 35%)" }}
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }} />

      <BrowserChrome className="relative" showUrlBar={false} />

      <div className="relative flex flex-col justify-center px-8 md:px-16 py-14 min-h-[500px] md:min-h-[580px]">
        {phase !== "activated" ? (
          <motion.div
            key="intro"
            animate={{ opacity: phase === "activating" ? 0.15 : 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-xl"
          >
            <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Interaction sur-mesure</p>
            <h3
              className="font-display text-kov-bone uppercase"
              style={{ fontSize: "clamp(28px, 3.6vw, 52px)", lineHeight: "var(--line-height-display)" }}
            >
              Activez votre site
              <br />
              en un geste.
            </h3>
            <p className="mt-6 text-kov-concrete text-sm leading-relaxed max-w-md">
              Chaque détail. Chaque animation. Chaque expérience pensée pour votre audience.
            </p>
            <div className="mt-12">
              <ActivationSlider onActivate={handleActivate} reducedMotion={reducedMotion} />
            </div>
          </motion.div>
        ) : (
          <div key="content">
            <motion.p
              className="text-xs uppercase tracking-widest text-kov-steel mb-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Système activé
            </motion.p>
            <motion.h3
              className="font-display text-kov-bone uppercase"
              style={{ fontSize: "clamp(26px, 3.2vw, 46px)", lineHeight: "var(--line-height-display)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              Un site ne devrait pas
              <br />
              simplement exister.
              <br />
              <span className="text-kov-red">Il devrait réagir.</span>
            </motion.h3>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CARDS.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.55 + i * 0.1, duration: 0.6 }}
                  className="p-5"
                  style={{
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
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activation wash — radiates from roughly where the slider sits,
          propagating out across the window rather than flashing everywhere
          at once. */}
      {phase === "activating" && (
        <motion.div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            left: "18%",
            bottom: "20%",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,77,77,0.9), rgba(227,30,36,0.3) 45%, transparent 70%)",
          }}
          initial={{ scale: 0, opacity: 0.9 }}
          animate={{ scale: 22, opacity: 0 }}
          transition={{ duration: PULSE_DURATION / 1000, ease: "easeOut" }}
        />
      )}

      {/* Black fade — the actual transition between the two window states */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--kov-black)" }}
        animate={{ opacity: blackOpacity }}
        transition={{ duration: (blackOpacity ? BLACK_FADE_IN : BLACK_FADE_OUT) / 1000, ease: "easeInOut" }}
      />
    </div>
  );
}
