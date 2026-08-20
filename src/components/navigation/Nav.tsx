"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { GlobalSearch } from "@/components/search/GlobalSearch";

const LINKS = [
  { href: "/#work", label: "Projets" },
  { href: "/expertise", label: "Expertise" },
  { href: "/studio", label: "Studio" },
];

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
  borderRadius: "var(--radius-pill)",
  boxShadow: "var(--glass-shadow-full)",
} as const;

export function Nav() {
  return (
    <div
      className="fixed top-4 inset-x-4 md:top-6 md:inset-x-8 flex items-center justify-between gap-4"
      style={{ zIndex: "var(--z-nav)" }}
    >
      <Link href="/" className="flex items-center px-5 py-3 border" style={GLASS_PILL_STYLE}>
        <Image
          src="/kov/brand/kov-wordmark-bone.png"
          alt="KOV"
          width={1116}
          height={209}
          className="h-5 w-auto"
          priority
        />
      </Link>

      <nav
        className="flex items-center gap-3 sm:gap-8 px-4 sm:px-6 py-3 text-xs uppercase tracking-widest text-kov-bone border"
        style={GLASS_PILL_STYLE}
      >
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-kov-red transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <GlobalSearch />
        <Link
          href="/login"
          aria-label="Espace client"
          title="Espace client"
          className="w-10 h-10 flex items-center justify-center text-kov-bone hover:text-kov-red transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </Link>
        <Button href="/contact" variant="pill">
          Contact
        </Button>
      </nav>
    </div>
  );
}
