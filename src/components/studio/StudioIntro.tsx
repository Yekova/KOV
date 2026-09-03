"use client";

import { motion } from "framer-motion";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface StudioIntroProps {
  onEnter: () => void;
  ready: boolean;
}

// The very first thing /studio shows — no marketing Hero, just KOV's own
// mark and a single entry action (studio spec §16). `ready` gates whether
// the button is actually clickable: the panorama texture loads underneath
// this screen while it's still showing, so entering never reveals a half-
// loaded sphere (studio spec §17) — the button just shows a quiet loading
// state until the texture is actually in memory.
export function StudioIntro({ onEnter, ready }: StudioIntroProps) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-10"
      style={{ background: "#050505", zIndex: "var(--z-modal)" as unknown as number }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <p className="font-display text-kov-bone uppercase tracking-widest text-sm">KOV</p>
        <p className="text-kov-steel uppercase tracking-widest text-[10px] mt-2">Virtual Studio</p>
      </div>

      <button type="button" onClick={onEnter} disabled={!ready} className="relative block disabled:cursor-default">
        <GlassSurface
          width="auto"
          height="auto"
          borderRadius={999}
          backgroundOpacity={0.35}
          className="inline-flex items-center text-kov-bone text-xs uppercase tracking-widest transition-opacity duration-300"
          style={{ opacity: ready ? 1 : 0.5 }}
        >
          <span className="inline-flex items-center gap-3 px-7 py-3.5">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red shrink-0" />
            <span>{ready ? "Entrer dans le studio" : "Initialisation…"}</span>
            {ready && (
              <span aria-hidden="true" className="inline-block">
                →
              </span>
            )}
          </span>
        </GlassSurface>
      </button>

      {!ready && (
        <p className="text-kov-steel text-[10px] uppercase tracking-widest" style={{ letterSpacing: "0.2em" }}>
          Initialisation du studio
        </p>
      )}
    </motion.div>
  );
}
