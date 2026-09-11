"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PILLARS } from "@/data/expertisePillars";

// A different abstract rotation/hue per pillar — purely decorative, behind
// the list (spec §17: "à droite ou derrière: une forme graphique abstraite
// KOV qui change selon l'expertise"), kept faint so it never competes with
// the list's own legibility.
function AbstractMark({ index }: { index: number }) {
  const rotation = index * 37;
  return (
    <motion.div
      aria-hidden="true"
      animate={{ rotate: rotation }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="absolute -right-3 -bottom-3 pointer-events-none"
      style={{ opacity: 0.12 }}
    >
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <rect x="6" y="6" width="60" height="60" stroke="var(--kov-red)" strokeWidth="1.5" />
        <circle cx="36" cy="36" r="18" stroke="var(--kov-bone)" strokeWidth="1" />
      </svg>
    </motion.div>
  );
}

export function ExpertiseSwitcherContent() {
  const [index, setIndex] = useState(1); // starts on "Design", per spec §17
  const pillar = PILLARS[index];

  return (
    <div className="relative h-full w-full flex flex-col p-4 overflow-hidden" style={{ borderRadius: 20 }}>
      <AbstractMark index={index} />

      <p className="relative z-10 text-kov-steel text-[10px] uppercase tracking-widest">Expertise</p>

      <nav className="relative z-10 flex-1 min-h-0 flex flex-col justify-center gap-0.5 mt-2">
        {PILLARS.map((p, i) => {
          const active = i === index;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => setIndex(i)}
              className="flex items-center gap-2 py-1 px-2 text-left rounded-md transition-colors duration-200"
              style={{
                background: active ? "rgba(255,255,255,0.05)" : "transparent",
                borderLeft: `2px solid ${active ? "var(--kov-red)" : "transparent"}`,
              }}
            >
              <span className="text-[9px] tabular-nums" style={{ color: active ? "var(--kov-red)" : "var(--kov-steel)" }}>
                {p.number}
              </span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: active ? "#fff" : "var(--kov-steel)" }}>
                {p.title}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="relative z-10 h-8 overflow-hidden mt-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={pillar.slug}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-kov-steel text-[10px] leading-snug"
          >
            {pillar.tagline}.
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
