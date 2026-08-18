"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useImmersiveScrollProgress } from "@/hooks/useImmersiveScrollProgress";
import { useSceneProgress } from "@/hooks/useSceneProgress";
import { Button } from "@/components/ui/Button";

const LINKS = [
  { href: "/#work", label: "Work" },
  { href: "/expertise", label: "Expertise" },
  { href: "/studio", label: "Studio" },
];

const PAGE_LABELS: Record<string, string> = {
  "/expertise": "EXPERTISE",
  "/studio": "STUDIO",
  "/contact": "CONTACT",
};

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
  borderRadius: "var(--radius-pill)",
  boxShadow: "var(--glass-shadow-full)",
} as const;

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
    <div
      className="fixed top-4 inset-x-4 md:top-6 md:inset-x-8 flex items-center justify-between gap-4"
      style={{ zIndex: "var(--z-nav)" }}
    >
      <Link
        href="/"
        className="font-display text-sm text-kov-bone px-6 py-3 border"
        style={GLASS_PILL_STYLE}
      >
        KOV
      </Link>

      <nav
        className="flex items-center gap-8 px-6 py-3 text-xs uppercase tracking-widest text-kov-bone border"
        style={GLASS_PILL_STYLE}
      >
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-kov-red transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <span className="hidden lg:inline text-kov-steel">{indicator}</span>
        <Button href="/contact" variant="pill">
          Contact us
        </Button>
      </nav>
    </div>
  );
}
