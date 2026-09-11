"use client";

import { useState } from "react";
import { PILLARS } from "@/data/expertisePillars";

export function ExpertiseSwitcherContent() {
  const [index, setIndex] = useState(1); // starts on "Design", per spec §05
  const pillar = PILLARS[index];

  function step(delta: number) {
    setIndex((i) => (i + delta + PILLARS.length) % PILLARS.length);
  }

  return (
    <div className="h-full w-full flex flex-col justify-between p-4" style={{ borderRadius: 20 }}>
      <p className="text-kov-steel text-[10px] uppercase tracking-widest">Expertise</p>

      <div>
        <p className="text-kov-red text-xs tabular-nums">{pillar.number}</p>
        <h3 className="font-display text-kov-bone uppercase mt-1" style={{ fontSize: "clamp(16px, 1.8vw, 20px)" }}>
          {pillar.title}
        </h3>
        <p className="text-kov-steel text-xs mt-1 leading-snug">{pillar.tagline}.</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Expertise précédente"
          className="w-7 h-7 flex items-center justify-center rounded-full text-kov-bone hover:text-kov-red transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.14)" }}
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Expertise suivante"
          className="w-7 h-7 flex items-center justify-center rounded-full text-kov-bone hover:text-kov-red transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.14)" }}
        >
          →
        </button>
      </div>
    </div>
  );
}
