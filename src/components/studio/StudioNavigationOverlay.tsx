"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StudioNavigationOverlayProps {
  active: boolean;
}

// The red-halo + black-fade half of navigateToNode's transition sequence
// (studio spec §27/§32) — the camera-orient step happens directly on
// CameraController's shared stateRef in StudioExperience; this component
// is purely the visual "something happened" beat layered on top, timed to
// cover the moment the sphere's texture is actually swapped for the new
// node's. Generic — nothing here is P01/P02-specific.
export function StudioNavigationOverlay({ active }: StudioNavigationOverlayProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ zIndex: "var(--z-modal)" }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--kov-black)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 1, 0] }}
            transition={{ duration: 1.1, times: [0, 0.25, 0.55, 0.8, 1], ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 40,
              height: 40,
              background: "radial-gradient(circle, rgba(255,77,77,0.9), rgba(227,30,36,0.3) 45%, transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 14, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
