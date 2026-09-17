"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/navigation/Nav";
import { Footer } from "@/components/layout/Footer";
import dynamic from "next/dynamic";
import { GlobalMenuButton } from "@/components/layout/GlobalMenuButton";
import { GlobalOverviewMenu } from "@/components/layout/GlobalOverviewMenu";
import { GlobalMenuProvider, useGlobalMenu } from "@/components/layout/GlobalMenuContext";

// Lenis + GSAP's ticker is ~160 KB, and SmoothScroll renders null — there is
// nothing of it in the server HTML to preserve. Statically imported it sat
// in the critical bundle of every marketing page, delaying the hydration
// that has to finish before the scroll can be smooth in the first place.
// Deferred, it starts a chunk-fetch later; on a slow connection that is
// still sooner than the old bundle finished parsing.
const SmoothScroll = dynamic(() => import("@/components/layout/SmoothScroll").then((m) => m.SmoothScroll), {
  ssr: false,
});

// The client portal (/client/*) and the admin back-office (/admin/*) each
// have their own sidebar+topbar shell (src/app/client/layout.tsx,
// src/app/admin/layout.tsx) — neither should also get the floating
// marketing nav pill and marketing footer. /login keeps today's
// marketing chrome unchanged. /studio is a full-viewport 3D experience
// with its own minimal HUD (StudioHUD.tsx) — the floating nav pill and a
// scrollable footer would both fight the "the studio is the whole
// viewport" requirement, so it gets the same bare passthrough.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/client") || pathname?.startsWith("/admin") || pathname?.startsWith("/studio")) {
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
      <SmoothScroll />
      {!isHome && <Nav />}
      {children}
      <Footer isHome={isHome} />
      {showGlobalMenu && (
        <>
          {!isHome && <GlobalMenuButton open={open} onToggle={toggle} />}
          <GlobalOverviewMenu open={open} onClose={close} />
        </>
      )}
    </>
  );
}
