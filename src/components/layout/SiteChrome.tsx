"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/navigation/Nav";
import { Footer } from "@/components/layout/Footer";

// The client portal (/client/*) has its own sidebar+topbar shell
// (src/app/client/layout.tsx) — it must not also get the floating
// marketing nav pill and marketing footer. /admin and /login keep
// today's marketing chrome unchanged.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname?.startsWith("/client")) {
    return <>{children}</>;
  }

  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
