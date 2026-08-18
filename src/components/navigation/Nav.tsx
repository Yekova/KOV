"use client";

import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useSceneProgress } from "@/hooks/useSceneProgress";

const LINKS = [
  { href: "#work", label: "Work" },
  { href: "#expertise", label: "Expertise" },
  { href: "#studio", label: "Studio" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const progress = useScrollProgress();
  const { scene, index } = useSceneProgress(progress);

  return (
    <nav
      className="fixed top-0 inset-x-0 flex items-center justify-between px-6 py-4 text-xs uppercase tracking-widest text-kov-bone backdrop-blur-[16px] border-b"
      style={{
        zIndex: "var(--z-nav)",
        background: "var(--glass-soft)",
        borderColor: "var(--glass-border)",
      }}
    >
      <span className="font-display text-sm">KOV</span>

      <div className="hidden md:flex gap-8">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="hover:text-kov-red transition-colors">
            {link.label}
          </a>
        ))}
      </div>

      <span className="text-kov-steel">
        {String(index + 1).padStart(2, "0")} / {scene.id.toUpperCase()}
      </span>
    </nav>
  );
}
