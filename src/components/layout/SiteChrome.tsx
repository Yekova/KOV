"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/navigation/Nav";
import { Footer } from "@/components/layout/Footer";
import { GlobalMenuButton } from "@/components/layout/GlobalMenuButton";
import { GlobalOverviewMenu } from "@/components/layout/GlobalOverviewMenu";
import { GlobalMenuProvider, useGlobalMenu } from "@/components/layout/GlobalMenuContext";

// The client portal (/client/*) and the admin back-office (/admin/*) each
// have their own sidebar+topbar shell (src/app/client/layout.tsx,
// src/app/admin/layout.tsx) — neither should also get the floating
// marketing nav pill and marketing footer. /login keeps today's
// marketing chrome unchanged.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/client") || pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <GlobalMenuProvider>
      <SiteChromeInner pathname={pathname}>{children}</SiteChromeInner>
    </GlobalMenuProvider>
  );
}

function SiteChromeInner({ pathname, children }: { pathname: string | null; children: React.ReactNode }) {
  const { open, toggle, close } = useGlobalMenu();

  // On the homepage, HeroScene renders its own contained Nav + GlobalMenuButton
  // nested inside its frame (see src/scenes/HeroScene.tsx) instead of the
  // usual viewport-fixed ones, so the frame can visually enclose them both.
  // Skip the default fixed instances there to avoid rendering two.
  const isHome = pathname === "/";

  // /login is a portal entry point, not marketing content — "browse the
  // whole site" doesn't belong next to a login form, same reasoning already
  // applied to /admin and /client above. Nav/Footer still render there.
  const showGlobalMenu = pathname !== "/login";

  return (
    <>
      {!isHome && <Nav />}
      {children}
      <Footer />
      {showGlobalMenu && (
        <>
          {!isHome && <GlobalMenuButton open={open} onToggle={toggle} />}
          <GlobalOverviewMenu open={open} onClose={close} />
        </>
      )}
    </>
  );
}
