// KOV motion timing tokens — see /docs/KOV-MOTION.md
// Motion = communication, never decoration. Slower than typical UI, never heavy.

export const motion = {
  micro: 0.18,
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  cinematic: 1.2,
} as const;

export type MotionSpeed = keyof typeof motion;

// Delay-per-item for staggered reveals (a card grid, a list of pillars).
// Kept separate from `motion` (which is duration, not delay) so a caller
// never has to guess which one governs "how long" vs "how far apart."
export const stagger = {
  tight: 0.04,
  normal: 0.06,
  loose: 0.1,
} as const;

export type StaggerSpacing = keyof typeof stagger;
