"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type GlobalMenuContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const GlobalMenuContext = createContext<GlobalMenuContextValue | null>(null);

// The global-menu trigger button renders in two different places depending
// on the route — inside HeroScene's own frame on "/" (so it's a genuine DOM
// descendant of the Hero's bordered container, not just visually overlapping
// it), and from SiteChrome everywhere else — while the full-screen overview
// modal itself always renders from SiteChrome (it's a portal, so where it's
// mounted in the tree doesn't matter). Context lets whichever button is
// currently on screen and the one modal share state without prop drilling
// through the page tree, same reasoning as MobileNavContext.
export function GlobalMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Safety net for back/forward navigation — every link inside the menu
  // already calls close() before navigating, so this rarely does the work.
  // Adjusted during render (React's documented pattern), not in an effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  const value: GlobalMenuContextValue = {
    open,
    toggle: () => setOpen((v) => !v),
    close: () => setOpen(false),
  };

  return <GlobalMenuContext.Provider value={value}>{children}</GlobalMenuContext.Provider>;
}

export function useGlobalMenu() {
  const ctx = useContext(GlobalMenuContext);
  if (!ctx) throw new Error("useGlobalMenu must be used within a GlobalMenuProvider.");
  return ctx;
}
