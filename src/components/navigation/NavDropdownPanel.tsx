"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, REVEAL_EASE } from "@/lib/motion";

interface NavDropdownPanelProps {
  visible: boolean;
  anchorTop: number;
  width: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: ReactNode;
}

// Portaled to <body> for the same reason as every other popup in this
// codebase (QuickActionMenu, GlobalSearch, UserMenu): the nav pill's own
// backdrop-filter breaks position:fixed containment for descendants, so
// position is computed manually from the pill's own measured rect instead.
// The "expanding card" read comes from scaling up from a flattened state
// with transform-origin at the top edge, using the same REVEAL_EASE unfurl
// timing as the nav pill's own route-change entrance.
export function NavDropdownPanel({ visible, anchorTop, width, onMouseEnter, onMouseLeave, children }: NavDropdownPanelProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      inert={!visible || undefined}
      className="fixed left-1/2 border"
      style={{
        top: anchorTop,
        width,
        maxWidth: "92vw",
        transform: `translate(-50%, 0) scale(${visible ? 1 : 0.96})`,
        transformOrigin: "top center",
        opacity: visible ? 1 : 0,
        filter: visible ? "blur(0px)" : "blur(4px)",
        pointerEvents: visible ? "auto" : "none",
        transitionProperty: "transform, opacity, filter, width",
        transitionDuration: `${motion.normal}s`,
        transitionTimingFunction: REVEAL_EASE,
        zIndex: "var(--z-modal)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-glass)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
