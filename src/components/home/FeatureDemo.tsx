"use client";

import { useState } from "react";

// The immersive window's own content, once it's fully "dived into" — a
// small live interaction rather than a screenshot, proving the section's
// own promise ("Un site qui vous ressemble") instead of just describing
// it. Self-contained: owns its own open/closed state, no scroll-awareness
// here at all — ImmersiveShowcase only wraps this in a div whose
// pointer-events it toggles once the dive has actually settled.
//
// Bespoke button markup rather than Button.tsx's pill variant — the brand
// docs explicitly rule out "big pills"; --radius-md (8px) matches the
// established rounded-rectangle "activatable" precedent already used for
// ContactWizard's selectable cards. The bubble reuses the site's existing
// glass-panel recipe (Nav.tsx's GLASS_PILL_STYLE) rather than a cartoon
// speech-bubble with a pointer tail, which would read more playful than
// KOV's editorial tone.
export function FeatureDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-6">
      <p className="text-xs uppercase tracking-widest text-kov-steel">Interaction sur-mesure</p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        className="px-8 py-4 text-xs uppercase tracking-widest text-kov-white transition-colors"
        style={{
          background: open ? "var(--kov-red-signal)" : "var(--kov-red)",
          borderRadius: "var(--radius-md)",
        }}
      >
        Activer
      </button>

      <div
        role="status"
        className="absolute top-full mt-4 w-64 text-center transition-[opacity,transform] duration-300"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(8px)",
          pointerEvents: open ? "auto" : "none",
          padding: "1.25rem",
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-glass)",
          boxShadow: "var(--glass-shadow-full)",
        }}
      >
        <p className="text-kov-bone text-sm">Activé.</p>
        <p className="text-kov-steel text-xs mt-1 leading-relaxed">
          Une interaction pensée au pixel près — comme chaque détail de votre site.
        </p>
      </div>
    </div>
  );
}
