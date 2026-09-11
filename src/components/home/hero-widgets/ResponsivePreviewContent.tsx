"use client";

import { useState } from "react";

// Real device-mockup footage (already shot for the homepage), reframed
// live via aspect-ratio + object-position rather than a fake browser
// chrome (spec §02 explicitly says not to build a real browser window).
const MODES = [
  { id: "mobile", label: "Mobile", aspectRatio: "9 / 16", objectPosition: "center" },
  { id: "tablet", label: "Tablette", aspectRatio: "3 / 4", objectPosition: "center" },
  { id: "desktop", label: "Desktop", aspectRatio: "16 / 10", objectPosition: "center 30%" },
] as const;

export function ResponsivePreviewContent() {
  const [modeId, setModeId] = useState<(typeof MODES)[number]["id"]>("mobile");
  const mode = MODES.find((m) => m.id === modeId) ?? MODES[0];

  return (
    <div className="relative h-full w-full flex flex-col p-4" style={{ borderRadius: 20 }}>
      <p className="text-kov-steel text-[10px] uppercase tracking-widest">Responsive</p>

      <div className="flex-1 min-h-0 flex items-center justify-center mt-3">
        <div className="relative h-full overflow-hidden" style={{ aspectRatio: mode.aspectRatio, borderRadius: 14, maxWidth: "100%" }}>
          <video
            src="/home/responsive-mockup.mp4"
            poster="/home/responsive-mockup-poster.jpg"
            muted
            autoPlay
            loop
            playsInline
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover transition-[object-position] duration-300"
            style={{ objectPosition: mode.objectPosition }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModeId(m.id)}
            className="px-2.5 py-1 text-[9px] uppercase tracking-widest rounded-full transition-colors"
            style={{
              color: m.id === modeId ? "var(--kov-bone)" : "var(--kov-steel)",
              background: m.id === modeId ? "rgba(227,30,36,0.18)" : "transparent",
              border: `1px solid ${m.id === modeId ? "rgba(227,30,36,0.4)" : "rgba(255,255,255,0.10)"}`,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
