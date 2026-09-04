"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { Button } from "@/components/ui/Button";
import { TagPill } from "@/components/ui/Chip";
import type { StudioArtwork } from "@/config/studio/studioNodes";

interface StudioProjectPanelProps {
  artwork: StudioArtwork | null;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  live: "Projet actif",
  upcoming: "Projet à venir",
};

// Opened by clicking a framed piece in the panorama (ArtworkHotspot) — a
// plain DOM overlay, not a 3D-anchored element, since it needs to read
// comfortably regardless of where on the wall the piece sits. Backdrop
// click, Escape, and an explicit close button all dismiss it — this is an
// info panel, not a consent choice, so an implicit-dismiss affordance is
// fine here (unlike CookieConsent.tsx, which deliberately has none).
export function StudioProjectPanel({ artwork, onClose }: StudioProjectPanelProps) {
  useEffect(() => {
    if (!artwork) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [artwork, onClose]);

  return (
    <AnimatePresence>
      {artwork && (
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
            aria-labelledby="studio-project-panel-title"
            className="relative w-full max-w-[480px]"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <GlassSurface width="auto" height="auto" borderRadius={18} className="block w-full">
              <div className="p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <p className="font-mono text-xs text-kov-steel">
                    {artwork.project.id} — {STATUS_LABEL[artwork.project.status]}
                  </p>
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

                <h2 id="studio-project-panel-title" className="font-display text-kov-bone uppercase text-2xl md:text-3xl">
                  {artwork.project.name}
                </h2>

                <p className="mt-3 text-kov-steel text-sm uppercase tracking-widest">{artwork.project.category}</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {artwork.project.tags.map((tag) => (
                    <TagPill key={tag}>{tag}</TagPill>
                  ))}
                </div>

                <div className="mt-8">
                  {artwork.project.caseStudyHref ? (
                    <Button variant="primary" href={artwork.project.caseStudyHref}>
                      Voir le projet
                    </Button>
                  ) : (
                    <>
                      <Button type="button" variant="primary" disabled>
                        Voir le projet
                      </Button>
                      <p className="mt-3 text-kov-steel text-[10px] uppercase tracking-widest">
                        Étude de cas bientôt disponible
                      </p>
                    </>
                  )}
                </div>
              </div>
            </GlassSurface>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
