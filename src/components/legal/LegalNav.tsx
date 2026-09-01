"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/legal", label: "Mentions légales" },
  { href: "/privacy", label: "Confidentialité" },
  { href: "/terms", label: "Conditions d'utilisation" },
  { href: "/cgv", label: "CGV" },
];

// A small switcher between the three legal docs — otherwise the only way
// between them is the footer, and someone reading one has no idea the
// other two exist right next to it.
export function LegalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 mb-16">
      {PAGES.map((page) => {
        const active = pathname === page.href;
        return (
          <Link
            key={page.href}
            href={page.href}
            className="px-4 py-2 text-xs uppercase tracking-widest border transition-colors"
            style={{
              borderColor: active ? "var(--kov-red)" : "var(--kov-border)",
              color: active ? "var(--kov-red)" : "var(--kov-steel)",
              borderRadius: "var(--radius-pill)",
            }}
          >
            {page.label}
          </Link>
        );
      })}
    </nav>
  );
}
