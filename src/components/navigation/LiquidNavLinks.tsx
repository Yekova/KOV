"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LIQUID_EASE } from "@/lib/motion";

interface NavLink {
  href: string;
  label: string;
}

interface Rect {
  left: number;
  width: number;
}

const BLOB_PADDING_X = 20;
const BLOB_HEIGHT = 30;

// A red "liquid" blob that flows from one nav link to another instead of a
// plain hover color change. Two identical shapes chase the same target rect
// on different transition durations — the lead arrives first, the trail lags
// behind, and while they're apart the eye reads the gap between them as a
// stretching liquid connector. No spring/bounce (see docs/KOV-MOTION.md) —
// the "liquid" quality comes from that lead/trail lag, not from overshoot.
export function LiquidNavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const activeIndex = links.findIndex((link) => {
    const path = link.href.split("#")[0] || "/";
    return path === pathname;
  });
  const targetIndex = hoveredIndex ?? (activeIndex >= 0 ? activeIndex : null);

  useLayoutEffect(() => {
    function measure() {
      const container = containerRef.current;
      const el = targetIndex !== null ? itemRefs.current[targetIndex] : null;
      if (!container || !el) {
        setRect(null);
        return;
      }
      const containerBox = container.getBoundingClientRect();
      const elBox = el.getBoundingClientRect();
      setRect({ left: elBox.left - containerBox.left, width: elBox.width });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [targetIndex]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-8"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {rect && (
        <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ filter: "blur(6px) contrast(24)" }}>
          {[motion.fast, motion.normal].map((duration) => (
            <span
              key={duration}
              className="absolute top-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: "var(--kov-red)",
                height: BLOB_HEIGHT,
                width: rect.width + BLOB_PADDING_X * 2,
                transform: `translateX(${rect.left - BLOB_PADDING_X}px)`,
                transitionProperty: "transform, width",
                transitionDuration: `${duration}s`,
                transitionTimingFunction: LIQUID_EASE,
              }}
            />
          ))}
        </div>
      )}

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
