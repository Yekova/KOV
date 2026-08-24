"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/navigation/Nav";
import { Footer } from "@/components/layout/Footer";
import { GlobalMenuButton } from "@/components/layout/GlobalMenuButton";
import { GlobalOverviewMenu } from "@/components/layout/GlobalOverviewMenu";

// The client portal (/client/*) and the admin back-office (/admin/*) each
// have their own sidebar+topbar shell (src/app/client/layout.tsx,
// src/app/admin/layout.tsx) — neither should also get the floating
// marketing nav pill and marketing footer. /login keeps today's
// marketing chrome unchanged.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Safety net for back/forward navigation — every link inside the menu
  // already calls onClose before navigating, so this rarely does the work.
  // Adjusted during render (React's documented pattern), not in an effect —
  // same idiom Nav.tsx uses for its own route-change reset.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  if (pathname?.startsWith("/client") || pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  // /login is a portal entry point, not marketing content — "browse the
  // whole site" doesn't belong next to a login form, same reasoning already
  // applied to /admin and /client above. Nav/Footer still render there.
  const showGlobalMenu = pathname !== "/login";

  return (
    <>
      <Nav />
      {children}
      <Footer />
      {showGlobalMenu && (
        <>
          <GlobalMenuButton open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
          <GlobalOverviewMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
      )}
    </>
  );
}
