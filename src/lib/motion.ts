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

// Smooth accelerate-decelerate, no overshoot — see docs/KOV-MOTION.md
// ("éviter : spring exagéré, bounce"). Used for the liquid nav indicator
// and the search reveal so both share one motion signature.
export const LIQUID_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

// Fast-out, long gentle settle — no overshoot either, just a different feel
// than LIQUID_EASE (which is symmetric). Used for reveal/unfurl moments
// where something needs to arrive with a bit more initial snap: the nav
// pill's entrance on route change, wizard step transitions.
export const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
