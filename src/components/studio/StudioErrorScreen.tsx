"use client";

interface StudioErrorScreenProps {
  onRetry: () => void;
}

// Texture load failure never leaves a broken/blank canvas visible (studio
// spec §40) — this replaces the whole experience with an honest, on-brand
// message and a working retry.
export function StudioErrorScreen({ onRetry }: StudioErrorScreenProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center px-6"
      style={{ background: "#050505" }}
    >
      <p className="font-display text-kov-bone uppercase text-lg tracking-wide">Impossible de charger le studio</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-xs uppercase tracking-widest text-kov-red hover:text-kov-red-signal transition-colors border px-6 py-3"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        Réessayer
      </button>
    </div>
  );
}
