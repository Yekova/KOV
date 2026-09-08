import Image from "next/image";
import "./ExpertiseVisuals.css";

// One visual per pillar, matched to what's realistically available — see
// the plan's own reasoning: two honest gaps (Stratégie/Systèmes... no,
// see below) get real assets or placeholders, the rest are lightweight
// CSS/SVG illustrations. None of these run a second WebGL context (one
// LineWaves shader already runs full-time as the page's own fixed
// background — a second live instance for one small decorative card
// would be a real, avoidable cost).

export function StrategyVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex flex-col items-center gap-2 text-kov-steel">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M21 16l-5-5-4 4-3-3-4 4" />
        </svg>
        <span className="text-[10px] uppercase tracking-widest">Photo à venir</span>
      </div>
    </div>
  );
}

// The hero card's own centerpiece — a soft red glow, no photo needed.
export function DesignVisual() {
  return (
    <div
      aria-hidden="true"
      className="w-full h-full"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 65% 40%, rgba(255,77,77,0.55), rgba(227,30,36,0.18) 45%, transparent 75%)",
      }}
    />
  );
}

export function DevelopmentVisual() {
  return (
    <div className="relative w-full h-full">
      <Image
        src="/kov/menu/atrium-brutaliste.jpg"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

// A small glowing orb with a slow, subtle pulse — pure CSS, no JS needed.
export function MotionVisual() {
  return (
    <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
      <div
        className="motion-orb"
        style={{
          width: "48%",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25), rgba(20,20,22,0.9) 60%, #0a0a0a 100%)",
          boxShadow: "0 0 30px rgba(227,30,36,0.25)",
        }}
      />
    </div>
  );
}

export function SystemsVisual() {
  return (
    <div className="relative w-full h-full">
      <Image
        src="/kov/menu/studio-industriel.jpg"
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}

// Flowing lines, lightweight SVG — no second WebGL canvas for a purely
// decorative accent (see file-level comment).
export function IntegrationVisual() {
  return (
    <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full integration-lines" aria-hidden="true">
      <path d="M0 70 C 80 30, 140 90, 220 50 S 340 20, 400 55" fill="none" stroke="var(--kov-red)" strokeWidth="1.2" opacity="0.6" />
      <path d="M0 45 C 90 80, 160 20, 240 60 S 350 90, 400 40" fill="none" stroke="var(--kov-steel)" strokeWidth="1" opacity="0.4" />
      <path d="M0 60 C 70 45, 180 70, 260 35 S 360 55, 400 65" fill="none" stroke="var(--kov-red-signal)" strokeWidth="0.8" opacity="0.35" />
    </svg>
  );
}
