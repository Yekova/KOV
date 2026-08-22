"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { LiquidNavLinks } from "@/components/navigation/LiquidNavLinks";
import { MobileNavMenu } from "@/components/navigation/MobileNavMenu";
import { REVEAL_EASE } from "@/lib/motion";

const LINKS = [
  { href: "/#work", label: "Projets" },
  { href: "/expertise", label: "Expertise" },
  { href: "/journal", label: "Journal" },
  { href: "/studio", label: "Studio" },
];

const SCROLL_THRESHOLD = 40;

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
  borderRadius: "var(--radius-pill)",
  boxShadow: "var(--glass-shadow-full)",
} as const;

const TRANSPARENT_PILL_STYLE = {
  background: "transparent",
  backdropFilter: "none",
  WebkitBackdropFilter: "none",
  borderColor: "transparent",
  borderRadius: "var(--radius-pill)",
  boxShadow: "none",
} as const;

export function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Unfurl on every route change: the pill drops to scale-x-0/invisible then
  // expands back out from the logo edge, rather than just sitting there
  // static across navigations. The reset itself happens during render (React's
  // documented "adjusting state when a prop changes" pattern) rather than in
  // an effect, to avoid the extra render pass that would otherwise cause —
  // only the timer-deferred re-reveal and the scroll reset are true side
  // effects, so only those live in a useEffect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setVisible(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setVisible(true), 220);
    return () => clearTimeout(timer);
  }, [pathname]);

  // KOV has no light-background pages to contrast against (see
  // docs/KOV-BRAND.md — the whole site is dark), so unlike a typical
  // marketing site there's no light/dark logo swap here. The equivalent
  // translation: transparent pill blending into the dark hero vs. the glass
  // pill everywhere else, text color stays constant.
  const transparent = isHome && !scrolled;
  const pillStyle = transparent ? TRANSPARENT_PILL_STYLE : GLASS_PILL_STYLE;
  const padding = scrolled || !isHome ? "py-2.5" : "py-3";

  return (
    <>
      <div
        className="fixed top-4 inset-x-4 md:top-6 md:inset-x-8 flex items-center justify-between gap-4"
        style={{
          zIndex: "var(--z-nav)",
          transform: visible ? "scaleX(1)" : "scaleX(0)",
          opacity: visible ? 1 : 0,
          filter: visible ? "blur(0px)" : "blur(2px)",
          transformOrigin: "right center",
          transition: `transform 0.9s ${REVEAL_EASE}, opacity 0.9s ${REVEAL_EASE}, filter 0.9s ${REVEAL_EASE}`,
          willChange: "transform",
        }}
      >
        <Link href="/" className={`flex items-center px-5 ${padding} border transition-all duration-500`} style={pillStyle}>
          <Image
            src="/kov/brand/kov-wordmark-bone.png"
            alt="KOV"
            width={1116}
            height={209}
            className="h-5 w-auto"
            priority
          />
        </Link>

        <nav
          className={`hidden md:flex items-center gap-3 sm:gap-8 px-4 sm:px-6 ${padding} text-xs uppercase tracking-widest text-kov-bone border transition-all duration-500`}
          style={pillStyle}
        >
          <LiquidNavLinks links={LINKS} />
          <GlobalSearch />
          <Link
            href="/login"
            aria-label="Espace client"
            title="Espace client"
            className="w-10 h-10 flex items-center justify-center text-kov-bone hover:text-kov-red transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </Link>
          <Button href="/contact" variant="pill">
            Contact
          </Button>
        </nav>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          className={`md:hidden flex flex-col justify-center items-end gap-1.5 w-11 h-11 px-4 border transition-all duration-500`}
          style={pillStyle}
        >
          <span
            className="block h-[1.5px] w-5 bg-kov-bone transition-transform duration-300"
            style={{ transform: mobileOpen ? "rotate(45deg) translateY(7px)" : "none" }}
          />
          <span
            className="block h-[1.5px] w-5 bg-kov-bone transition-opacity duration-300"
            style={{ opacity: mobileOpen ? 0 : 1 }}
          />
          <span
            className="block h-[1.5px] w-5 bg-kov-bone transition-transform duration-300"
            style={{ transform: mobileOpen ? "rotate(-45deg) translateY(-7px)" : "none" }}
          />
        </button>
      </div>

      <MobileNavMenu open={mobileOpen} onClose={() => setMobileOpen(false)} links={LINKS} />
    </>
  );
}
