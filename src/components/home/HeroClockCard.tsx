"use client";

import { useEffect, useState } from "react";

// A real, live-ticking clock — not a mockup number — reusing the same
// approach as the reduced-motion lazy-initializer convention used
// elsewhere in this codebase (LightPillar.tsx, LiquidEther.tsx): computed
// once up front, then advanced by the interval below.
function readParisTime() {
  const now = new Date();
  return {
    time: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(now),
    date: new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short" }).format(now),
  };
}

export function HeroClockCard() {
  const [{ time, date }, setClock] = useState(() => readParisTime());

  useEffect(() => {
    const id = window.setInterval(() => setClock(readParisTime()), 1000 * 15);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="h-full w-full flex flex-col justify-between p-4"
      style={{ borderRadius: 18, background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest">Studio</p>
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
      </div>
      <div>
        <p className="font-display text-kov-bone tabular-nums" style={{ fontSize: "clamp(22px, 2.4vw, 32px)" }}>
          {time}
        </p>
        <p className="text-kov-steel text-[10px] uppercase tracking-widest mt-1">Bordeaux · {date}</p>
      </div>
    </div>
  );
}
