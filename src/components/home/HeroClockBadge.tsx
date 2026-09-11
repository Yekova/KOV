"use client";

import { useEffect, useState } from "react";

// Small live-time overlay for the hero's top photo (real, ticking Paris
// time — not a static mockup number) rather than its own dashboard-widget
// slot: only the stack's last two photos were asked to become widgets, so
// this rides on the photo that stays as-is instead of claiming a slot.
function readParisTime() {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function HeroClockBadge() {
  // Lazy initializer, not a setState-in-effect call — same convention used
  // for reduced-motion checks elsewhere in this codebase (see
  // LightPillar.tsx, LiquidEther.tsx). Ticks itself forward via the
  // interval below rather than depending on the initial render's time.
  const [time, setTime] = useState(() => readParisTime());

  useEffect(() => {
    const id = window.setInterval(() => setTime(readParisTime()), 1000 * 15);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5"
      style={{
        borderRadius: 999,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red" />
      <span className="text-kov-bone text-xs tabular-nums">{time}</span>
      <span className="text-kov-steel text-[10px] uppercase tracking-widest">Bordeaux</span>
    </div>
  );
}
