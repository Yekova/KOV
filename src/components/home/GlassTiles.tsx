import type { CSSProperties } from "react";

const COLUMNS = 10;
const ROWS = 6;
const TILE_COUNT = COLUMNS * ROWS;

// Deterministic pseudo-random (seeded by tile index), not Math.random() —
// this renders on the server too, and Math.random() would produce a
// different value per environment and break hydration.
function seededRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const TILES = Array.from({ length: TILE_COUNT }, (_, i) => {
  const isRedGlint = seededRandom(i * 3.1) > 0.88; // sparse — red stays a signal color, not a theme
  return {
    delay: seededRandom(i) * 6,
    duration: 4 + seededRandom(i * 1.7) * 4,
    isRedGlint,
  };
});

// A background of shimmering glass tiles for the Hero, recolored to KOV's
// actual palette (graphite/carbon/bone, sparse red glints) rather than the
// generic "colorful" brief — a rainbow tile field would contradict the
// brand's black-dominant, red-as-signal-only rule. Pure CSS keyframes, no
// canvas/WebGL: this is a repeating opacity/glow shimmer, not something
// that needs per-frame JS. prefers-reduced-motion freezes the animation via
// the stylesheet itself (see globals.css), same as any other CSS animation
// on the site — no JS gating needed for a pure CSS effect.
export function GlassTiles() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 grid"
      style={{
        zIndex: "var(--z-canvas)",
        gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {TILES.map((tile, i) => {
        const style = {
          borderColor: "var(--glass-border)",
          background: "var(--glass-bg)",
          animationDelay: `${tile.delay}s`,
          animationDuration: `${tile.duration}s`,
          "--glass-tile-glow": tile.isRedGlint ? "rgba(227, 30, 36, 0.35)" : "rgba(255, 255, 255, 0.12)",
        } as CSSProperties;
        return <div key={i} className="glass-tile" style={style} />;
      })}
    </div>
  );
}
