"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { ActivationSlider } from "@/components/home/ActivationSlider";
import PlasmaWave from "@/components/home/PlasmaWaveLazy";

// Once the drag completes, a brief pulse plays inside the window, then the
// activated content (below) cross-fades in — in place, inside the same
// window, rather than a separate page taking over the viewport.
const PULSE_DURATION = 850;

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
// holding a centered heading + the ActivationSlider. Once dragged past
// threshold: a brief pulse, then the SAME window's content swaps in place
// to the result (heading + feature cards) — one continuous window and one
// continuous background (PlasmaWave) throughout, no fullscreen takeover.
export function ActivationWindow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function handleActivate() {
    if (reducedMotion) {
      setPhase("activated");
      return;
    }
    setPhase("activating");
    timers.current.push(setTimeout(() => setPhase("activated"), PULSE_DURATION));
  }

  return (
    <div
      className="relative w-[92vw] sm:w-[86vw] max-w-[1440px] mx-auto overflow-hidden min-h-[560px] md:min-h-[640px]"
      style={{
        borderRadius: 28,
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow-full), 0 60px 120px -40px rgba(0,0,0,0.7)",
      }}
    >
      {/* Solid dark base — PlasmaWave renders transparent everywhere except
          its glowing wave shapes (see the shader's `discard` branch), so
          without this the window would show whatever's behind the section
          instead of reading as an opaque device. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 30% 15%, var(--kov-carbon), var(--kov-black) 65%)" }}
      />

      {/* The requested reactbits.dev PlasmaWave background — contained
          inside the window at all times (idle and activated alike), so
          there's one continuous backdrop instead of swapping to a
          separate fullscreen page on activation. */}
      <div aria-hidden="true" className="absolute inset-0">
        <PlasmaWave colors={["#f75555", "#ff0000"]} speed1={0.05} speed2={0.05} dir2={1} focalLength={0.8} bend1={1} bend2={0.5} />
      </div>

      {/* Legibility scrim — a light, uniform dim so text stays readable
          against the plasma regardless of where its glow currently sits. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "rgba(5,5,5,0.3)" }} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 1px 0 var(--glass-highlight)" }} />

      <BrowserChrome className="relative" showUrlBar={false} />

      <div className="relative flex flex-col items-center justify-center text-center px-8 md:px-16 py-14 min-h-[500px] md:min-h-[580px]">
        <AnimatePresence mode="wait" initial={false}>
          {phase !== "activated" ? (
            <motion.div
              key="idle"
              animate={{ opacity: phase === "activating" ? 0.15 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center w-full"
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
              className="flex flex-col items-center w-full"
            >
              <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Système activé</p>
              <h3
                className="font-display text-kov-bone uppercase max-w-2xl"
                style={{ fontSize: "clamp(26px, 3.2vw, 46px)", lineHeight: "var(--line-height-display)" }}
              >
                Un site ne devrait pas simplement exister.
                <br />
                <span className="text-kov-red">Il devrait réagir.</span>
              </h3>
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
                {CARDS.map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.15 + i * 0.08 }}
                    className="p-5 text-left"
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
    </div>
  );
}
