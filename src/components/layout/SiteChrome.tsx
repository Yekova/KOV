"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/navigation/Nav";
import { Footer } from "@/components/layout/Footer";

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
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
