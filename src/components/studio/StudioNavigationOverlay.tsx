"use client";

import { motion, AnimatePresence } from "framer-motion";

/** Time the black takes to close over the current room. */
export const NAV_COVER_MS = 420;
/** Time it takes to open again on the new one — slower than the close, so
 * arriving feels like a reveal rather than a cut. */
export const NAV_REVEAL_MS = 620;

interface StudioNavigationOverlayProps {
  active: boolean;
}

// The black half of navigateToNode's transition (the camera-orient nudge
// happens separately, on CameraController's shared stateRef).
//
// This used to run a fixed 1.1s keyframe timeline — fade in, hold, fade
// out — on a timer that had no idea when the new panorama was actually
// ready. The numbers worked out badly: the black finished fading out at
// 1400ms and the texture was swapped at exactly 1400ms, so the previous
// room faded back into view and only then flipped to the new one. That
// visible flash of the old room was the transition doing precisely what it
// was written to do.
//
// So the timeline is gone. This now only closes and opens; how long it
// stays closed is decided by whoever is driving it, which is the one place
// that knows whether the new room has arrived and painted.
export function StudioNavigationOverlay({ active }: StudioNavigationOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ zIndex: "var(--z-modal)", background: "var(--kov-black)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: NAV_COVER_MS / 1000, ease: "easeInOut" } }}
          exit={{ opacity: 0, transition: { duration: NAV_REVEAL_MS / 1000, ease: [0.22, 1, 0.36, 1] } }}
        >
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.18, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
          >
            <p className="font-display text-kov-bone uppercase tracking-widest text-sm">KOV</p>
            <p className="text-kov-steel uppercase tracking-widest text-[10px] mt-2">Virtual Studio</p>
          </motion.div>

          {/* Fires once as the black closes — a departure beat, gone well
              before the new room is revealed. */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 40,
              height: 40,
              background: "radial-gradient(circle, rgba(255,77,77,0.9), rgba(227,30,36,0.3) 45%, transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 14, opacity: 0, transition: { duration: 0.55, ease: "easeOut" } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
