"use client";

import type { ReactNode } from "react";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}

// Shared small square icon button for both toolbar rows and the contextual
// image sub-toolbar — muted steel by default, bone/red on hover, red with a
// tinted fill when active (mirrors AdminSidebar's active-nav-item treatment).
export function ToolbarButton({ onClick, active = false, disabled = false, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 border border-transparent shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active ? "" : "text-[var(--kov-steel)] hover:text-[var(--kov-bone)] hover:border-[var(--kov-border)]"
      }`}
      style={{
        borderRadius: "var(--radius-sm)",
        ...(active
          ? { color: "var(--kov-red)", borderColor: "var(--kov-red)", background: "rgba(227, 30, 36, 0.12)" }
          : undefined),
      }}
    >
      {children}
    </button>
  );
}

// Toolbar row / container chrome shared by the main toolbar and the
// contextual image toolbar.
export function ToolbarRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1">{children}</div>;
}

export function ToolbarDivider() {
  return <div className="w-px h-5 mx-1 shrink-0" style={{ background: "var(--kov-border)" }} />;
}
