"use client";

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
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
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
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer le menu"
        className="absolute top-6 right-6 text-kov-bone text-2xl leading-none"
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
