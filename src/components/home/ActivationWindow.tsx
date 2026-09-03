"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { motion } from "framer-motion";
import { BrowserChrome } from "@/components/ui/BrowserChrome";
import { ActivationSlider } from "@/components/home/ActivationSlider";
import { ActivationFullscreen } from "@/components/home/ActivationFullscreen";
import "./ActivationWindow.css";

// Once the drag completes, a brief pulse plays inside the small window,
// then ActivationFullscreen mounts — it starts fully opaque black itself,
// so the handoff reads as one continuous "the window opens up" beat rather
// than two separate transitions stitched together. The small window's
// content dims during the pulse but doesn't need its own fade-out
// anymore: the fullscreen overlay covers it entirely once mounted.
const PULSE_DURATION = 850;

type Phase = "idle" | "activating" | "fullscreen";

// The section's own object: a premium macOS-style window (no fake address
// bar — this isn't a browser mock, it's KOV's own digital environment)
// holding an editorial intro + the ActivationSlider. Once dragged past
// threshold: a radial pulse, then the SAME window opens up into a
// fullscreen takeover (ActivationFullscreen.tsx) rather than swapping
// content in place — matching "the window opens onto the whole screen"
// directly.
export function ActivationWindow() {
  const windowRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
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
    if (reducedMotion) {
      setPhase("fullscreen");
      return;
    }
    setPhase("activating");
    timers.current.push(setTimeout(() => setPhase("fullscreen"), PULSE_DURATION));
  }

  return (
    <>
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
          <motion.div
            animate={{ opacity: phase === "activating" ? 0.15 : phase === "fullscreen" ? 0 : 1 }}
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
        </div>

        {/* Activation wash — radiates from roughly where the slider sits,
            propagating out across the window rather than flashing everywhere
            at once. */}
        {phase === "activating" && !reducedMotion && (
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
      </div>

      {phase === "fullscreen" && <ActivationFullscreen />}
    </>
  );
}
