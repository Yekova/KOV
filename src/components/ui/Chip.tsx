import type { ReactNode } from "react";

export function TagPill({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block px-4 py-1.5 border text-kov-concrete text-[11px] uppercase tracking-widest"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
    >
      {children}
    </span>
  );
}
