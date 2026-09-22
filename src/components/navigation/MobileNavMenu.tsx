"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface NavLink {
  href: string;
  label: string;
}

// Full-screen mobile menu — KOV's nav previously had no mobile navigation at
// all below md (the text links were just hidden with nothing to replace
// them). Portaled to escape the nav pill's own stacking context, same
// reasoning as every other portaled popup in this codebase.
export function MobileNavMenu({ open, onClose, links }: { open: boolean; onClose: () => void; links: NavLink[] }) {
  // Escape closes it — loi de Jakob. Every overlay on the web does this, and
  // every other overlay in this codebase already did (the nav dropdowns,
  // GlobalOverviewMenu, the studio panels); this one, the primary navigation
  // on a phone, was the exception.
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Hooks first, then the SSR guard — never the other way round.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      // The menu stays mounted when closed so it can fade rather than
      // disappear, which used to mean its links kept their place in the tab
      // order and in the accessibility tree while fully invisible: a
      // keyboard visitor on desktop would tab off the page into four links
      // nobody could see. `inert` removes the whole subtree from both, and
      // costs nothing when open.
      inert={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navigation"
      className="fixed inset-0 md:hidden transition-opacity duration-500"
      style={{
        zIndex: "var(--z-modal)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        background: "var(--kov-black)",
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
      }}
    >
      {/* The glyph is still 24px of ink; the button around it is now 44px of
          target, in the hardest corner of a phone screen to hit. Loi de
          Fitts — the hit area grew, the design did not. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le menu"
        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center text-kov-bone text-2xl leading-none"
      >
        ✕
      </button>
      <nav className="flex flex-col items-center justify-center gap-5 h-full">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="font-display text-kov-bone uppercase text-3xl hover:text-kov-red transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>,
    document.body
  );
}
