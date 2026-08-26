"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { SITE_SECTIONS } from "@/data/siteSections";

type Edge = "top" | "bottom";
type RowState = { visible: boolean; edge: Edge };

function closestEdge(clientY: number, rect: DOMRect): Edge {
  return clientY - rect.top < rect.height / 2 ? "top" : "bottom";
}

// Repeated many times over so the marquee track comfortably exceeds any
// realistic viewport width — rendered twice back-to-back so animating
// translateX(0 → -50%) loops seamlessly, no runtime width measurement
// needed (the original component measures and computes an exact repeat
// count via ResizeObserver; a generous fixed count is simpler and robust
// enough for short one-word labels).
const REPEAT_COUNT = 10;

// Adapted from reactbits.dev's FlowingMenu — a full-width row per link,
// with a colored panel that slides in from whichever edge (top/bottom) the
// cursor entered/left through, carrying a looping marquee of the label.
// The original drives this with GSAP; ported here as plain CSS transitions
// + transform, per this codebase's no-animation-library rule (the motion
// itself — slide a panel to translateY(0), ease out — is well within
// hand-rolled territory, unlike LiquidEther's fluid sim). Recolored to
// KOV's actual palette: a solid red panel with the label inverted to
// near-black, rather than the original's white-panel/dark-text default.
export function ImmersiveMenuList({ onNavigate }: { onNavigate: () => void }) {
  const [rows, setRows] = useState<Record<number, RowState>>({});

  function handleEnter(index: number, event: MouseEvent<HTMLElement>) {
    const edge = closestEdge(event.clientY, event.currentTarget.getBoundingClientRect());
    setRows((prev) => ({ ...prev, [index]: { visible: true, edge } }));
  }

  function handleLeave(index: number, event: MouseEvent<HTMLElement>) {
    const edge = closestEdge(event.clientY, event.currentTarget.getBoundingClientRect());
    setRows((prev) => ({ ...prev, [index]: { visible: false, edge } }));
  }

  return (
    <nav className="border-t" style={{ borderColor: "var(--kov-border)" }}>
      {SITE_SECTIONS.map((section, index) => {
        const state = rows[index] ?? { visible: false, edge: "bottom" as Edge };
        return (
          <Link
            key={section.href}
            href={section.href}
            onClick={onNavigate}
            onMouseEnter={(event) => handleEnter(index, event)}
            onMouseLeave={(event) => handleLeave(index, event)}
            className="group relative flex items-center justify-between gap-6 px-2 py-6 md:py-9 border-b overflow-hidden"
            style={{ borderColor: "var(--kov-border)" }}
          >
            <span className="relative z-10 flex items-baseline gap-4 md:gap-6">
              <span
                className="font-mono text-xs transition-colors duration-300"
                style={{ color: state.visible ? "rgba(10, 10, 10, 0.65)" : "var(--kov-red)" }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className="font-display uppercase transition-colors duration-300"
                style={{
                  fontSize: "var(--heading-lg)",
                  lineHeight: "var(--line-height-display)",
                  color: state.visible ? "var(--kov-black)" : "var(--kov-bone)",
                }}
              >
                {section.label}
              </span>
            </span>

            <span
              className="relative z-10 hidden md:block text-sm max-w-xs text-right transition-colors duration-300"
              style={{ color: state.visible ? "rgba(10, 10, 10, 0.65)" : "var(--kov-steel)" }}
            >
              {section.description}
            </span>

            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center overflow-hidden pointer-events-none"
              style={{
                background: "var(--kov-red)",
                transform: `translateY(${state.visible ? "0%" : state.edge === "top" ? "-101%" : "101%"})`,
                transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div className="menu-marquee-track flex whitespace-nowrap">
                {Array.from({ length: 2 }, (_, group) => (
                  <span key={group} className="flex whitespace-nowrap" aria-hidden={group === 1}>
                    {Array.from({ length: REPEAT_COUNT }, (_, i) => (
                      <span
                        key={i}
                        className="font-display uppercase px-6"
                        style={{ fontSize: "var(--heading-lg)", color: "rgba(10, 10, 10, 0.85)" }}
                      >
                        {section.label} —
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
