"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Real device-mockup footage (already shot for the homepage), reframed
// live via aspect-ratio + object-position rather than a fake browser
// chrome (spec §02/§12 explicitly say not to build a real browser window).
const MODES = [
  { id: "mobile", label: "Mobile", aspectRatio: "9 / 16", objectPosition: "center" },
  { id: "tablet", label: "Tablette", aspectRatio: "3 / 4", objectPosition: "center" },
  { id: "desktop", label: "Desktop", aspectRatio: "16 / 10", objectPosition: "center 30%" },
] as const;

export function ResponsivePreviewContent() {
  const [modeId, setModeId] = useState<(typeof MODES)[number]["id"]>("mobile");
  const mode = MODES.find((m) => m.id === modeId) ?? MODES[0];

  return (
    // overflow-hidden here (not on the frame below) so the frame can sit
    // at a slightly larger, decentered scale and genuinely spill past its
    // own logical box (spec §12: "le téléphone doit sortir légèrement du
    // cadre") while still being clipped to this card's own rounded shape,
    // not bleeding into neighboring widgets.
    <div className="relative h-full w-full flex flex-col p-4 overflow-hidden" style={{ borderRadius: 20 }}>
      <p className="relative z-10 flex items-center gap-2 text-kov-steel text-[10px] uppercase tracking-widest">
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
        Aperçu responsive
      </p>

      <div className="relative flex-1 min-h-0 mt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={modeId}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="relative h-[112%] overflow-hidden"
              style={{ aspectRatio: mode.aspectRatio, borderRadius: 14, maxWidth: "112%" }}
            >
              <video
                src="/home/responsive-mockup.mp4"
                poster="/home/responsive-mockup-poster.jpg"
                muted
                autoPlay
                loop
                playsInline
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: mode.objectPosition }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-1.5 mt-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModeId(m.id)}
            className="px-2.5 py-1 text-[9px] uppercase tracking-widest rounded-full transition-colors duration-200"
            style={{
              color: m.id === modeId ? "#fff" : "var(--kov-steel)",
              background: m.id === modeId ? "rgba(227,30,36,0.35)" : "transparent",
              border: `1px solid ${m.id === modeId ? "var(--kov-red)" : "rgba(255,255,255,0.10)"}`,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
