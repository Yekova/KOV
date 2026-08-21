"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

// The sidebar and topbar are fetched in two independent <Suspense> boundaries
// (see admin/layout.tsx — deliberate, so neither blocks route transitions on
// the other's queries), so they can't share this via simple prop drilling
// from a single client wrapper the way the client portal's PortalShell does.
// Context lets the hamburger button (in the topbar) and the drawer (in the
// sidebar) coordinate without touching that Suspense architecture.
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MobileNavContext.Provider value={{ open, setOpen }}>{children}</MobileNavContext.Provider>;
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error("useMobileNav must be used within a MobileNavProvider.");
  return ctx;
}
