"use client";

import { useMobileNav } from "./MobileNavContext";

export function MobileNavToggle() {
  const { setOpen } = useMobileNav();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Ouvrir le menu"
      className="md:hidden text-kov-bone hover:text-kov-red transition-colors shrink-0"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}
