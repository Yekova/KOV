"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassSurface } from "@/components/ui/GlassSurface";
import type { StudioInfoHotspot } from "@/config/studio/studioNodes";

interface StudioInfoPanelProps {
  hotspot: StudioInfoHotspot | null;
  onClose: () => void;
}

// Opened by clicking an InfoHotspot — same backdrop/GlassSurface/Escape
// pattern as StudioProjectPanel.tsx, simplified: title + body + close,
// no CTA button (there's nothing to link to, unlike a project).
export function StudioInfoPanel({ hotspot, onClose }: StudioInfoPanelProps) {
  useEffect(() => {
    if (!hotspot) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hotspot, onClose]);

  return (
    <AnimatePresence>
      {hotspot && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center p-6"
          style={{ zIndex: "var(--z-modal)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: "rgba(5,5,5,0.7)" }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-info-panel-title"
            className="relative w-full max-w-[440px]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassSurface width="auto" height="auto" borderRadius={18} className="block w-full">
              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <p className="text-xs uppercase tracking-widest text-kov-red">KOV</p>
                  <button
                    type="button"
                    autoFocus
                    onClick={onClose}
                    aria-label="Fermer"
                    className="text-kov-steel hover:text-kov-red transition-colors text-xs uppercase tracking-widest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
                    style={{ outlineColor: "var(--kov-red)" }}
                  >
                    Fermer ×
                  </button>
                </div>

                <h2 id="studio-info-panel-title" className="font-display text-kov-bone uppercase text-xl md:text-2xl mb-4">
                  {hotspot.title}
                </h2>

                <p className="text-kov-steel text-sm leading-relaxed">{hotspot.body}</p>
              </div>
            </GlassSurface>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
