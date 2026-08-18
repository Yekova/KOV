import type { ReactNode } from "react";

// Flags facts that cannot be fabricated (SIRET, legal form, registered
// address, retention periods, etc.) — must be filled in with real
// information before these pages go live.
export function Todo({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-kov-red text-xs uppercase tracking-widest border"
      style={{ borderColor: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
    >
      À COMPLÉTER : {children}
    </span>
  );
}
