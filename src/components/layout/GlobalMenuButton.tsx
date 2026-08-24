"use client";

const DOT_POSITIONS = [4, 12, 20];

// Fixed bottom-center glass pill, icon-only — a 3x3 grid of dots ("bento" /
// app-launcher glyph) that opens GlobalOverviewMenu. Same glass-pill token
// recipe Nav.tsx uses, duplicated here since no shared constant exists for
// it anywhere in the codebase yet (NavDropdownPanel and MobileNavMenu each
// duplicate their own glass style block too).
export function GlobalMenuButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={open ? "Fermer l'aperçu du site" : "Voir tout le site"}
      className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-11 h-11 flex items-center justify-center border text-kov-bone hover:text-kov-red transition-colors"
      style={{
        zIndex: "var(--z-nav)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-pill)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        {DOT_POSITIONS.flatMap((cy) =>
          DOT_POSITIONS.map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" />)
        )}
      </svg>
    </button>
  );
}
