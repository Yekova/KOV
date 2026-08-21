"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiquidRect } from "@/lib/useLiquidRect";
import { LiquidBlob } from "@/components/ui/LiquidBlob";

interface NavLink {
  href: string;
  label: string;
}

const BLOB_PADDING_X = 20;
const BLOB_HEIGHT = 30;

// A red "liquid" blob that flows from one nav link to another instead of a
// plain hover color change — see LiquidBlob.tsx for the mechanism.
export function LiquidNavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeIndex = links.findIndex((link) => {
    const path = link.href.split("#")[0] || "/";
    return path === pathname;
  });
  const targetIndex = hoveredIndex ?? (activeIndex >= 0 ? activeIndex : null);

  const { containerRef, itemRefs, rect } = useLiquidRect<HTMLAnchorElement>(targetIndex);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-8"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <LiquidBlob rect={rect} height={BLOB_HEIGHT} paddingX={BLOB_PADDING_X} />

      {links.map((link, index) => (
        <Link
          key={link.href}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          href={link.href}
          onMouseEnter={() => setHoveredIndex(index)}
          className="relative z-10 transition-colors"
          style={{ color: index === targetIndex ? "var(--kov-white)" : undefined }}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
