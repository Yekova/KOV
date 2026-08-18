"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useImmersiveScrollProgress } from "@/hooks/useImmersiveScrollProgress";
import { useSceneProgress } from "@/hooks/useSceneProgress";

const LINKS = [
  { href: "/#work", label: "Work" },
  { href: "/expertise", label: "Expertise" },
  { href: "/studio", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

const PAGE_LABELS: Record<string, string> = {
  "/expertise": "EXPERTISE",
  "/studio": "STUDIO",
  "/contact": "CONTACT",
};

export function Nav() {
  const pathname = usePathname();
  const { progress, active } = useImmersiveScrollProgress();
  const { scene, index } = useSceneProgress(progress);

  const isHome = pathname === "/";
  const indicator =
    isHome && active
      ? `${String(index + 1).padStart(2, "0")} / ${scene.id.toUpperCase()}`
      : PAGE_LABELS[pathname] ?? "KOV";

  return (
    <nav
      className="fixed top-0 inset-x-0 flex items-center justify-between px-6 py-4 text-xs uppercase tracking-widest text-kov-bone backdrop-blur-[16px] border-b"
      style={{
        zIndex: "var(--z-nav)",
        background: "var(--glass-soft)",
        borderColor: "var(--glass-border)",
      }}
    >
      <Link href="/" className="font-display text-sm">
        KOV
      </Link>

      <div className="hidden md:flex gap-8">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-kov-red transition-colors">
            {link.label}
          </Link>
        ))}
      </div>

      <span className="text-kov-steel">{indicator}</span>
    </nav>
  );
}
