"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

// Shared by both the admin and client shells: each one's sidebar and topbar
// are fetched in two independent <Suspense> boundaries (see admin/layout.tsx
// and client/layout.tsx — deliberate, so neither blocks route transitions on
// the other's queries), so they can't share this via simple prop drilling
// from a single client wrapper. Context lets the hamburger button (in the
// topbar) and the drawer (in the sidebar) coordinate without touching that
// Suspense architecture. Safe to share one module across both portals — a
// module-level createContext is still scoped per Provider instance in the
// tree, and admin/client routes never render in the same tree at once.
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within a MobileNavProvider.");
  return ctx;
}
