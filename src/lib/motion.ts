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
