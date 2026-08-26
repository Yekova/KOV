"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NavLinks, type NavLinkItem } from "@/components/navigation/NavLinks";
import { MobileNavMenu } from "@/components/navigation/MobileNavMenu";
import { REVEAL_EASE } from "@/lib/motion";

const LINKS: NavLinkItem[] = [
  { href: "/#work-gallery", label: "Projets" },
  { href: "/expertise", label: "Expertise", dropdownKey: "expertise" },
  { href: "/journal", label: "Journal" },
  { href: "/studio", label: "Studio", dropdownKey: "studio" },
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

interface NavProps {
  /** "contained": positioned absolute within a positioned ancestor (used by
   * HeroScene, which nests Nav inside its own frame) instead of fixed to the
   * viewport. Same pill, same offsets from its container's edge either way. */
  variant?: "fixed" | "contained";
}

export function Nav({ variant = "fixed" }: NavProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

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

  // Always the glass pill now — the Hero itself supplies a glass strip for
  // Nav to visually sit inside (src/scenes/HeroScene.tsx), so an invisible
  // transparent-on-home variant would defeat that "enclosed" look.
  const pillStyle = GLASS_PILL_STYLE;
  const padding = scrolled || !isHome ? "py-2.5" : "py-3";

  return (
    <>
      {/* Outer element owns centering only (a permanent, un-animated
          translateX(-50%)); the inner element owns the route-change unfurl
          (scaleX from its own center). Keeping the two transforms on
          separate elements avoids composing "translate + scale" into one
          transform string, which would need the unfurl to fight the
          centering offset. */}
      <div
        className={`${variant === "contained" ? "absolute" : "fixed"} top-4 md:top-6 left-1/2 -translate-x-1/2`}
        style={{ zIndex: "var(--z-nav)" }}
      >
        <div
          ref={pillRef}
          className={`flex items-center justify-between gap-2 sm:gap-4 px-2.5 sm:px-3 ${padding} border`}
          style={{
            ...pillStyle,
            transform: visible ? "scaleX(1)" : "scaleX(0)",
            opacity: visible ? 1 : 0,
            filter: visible ? "blur(0px)" : "blur(2px)",
            transformOrigin: "center",
            transitionProperty: "transform, opacity, filter, background, border-color, box-shadow, padding",
            transitionDuration: "0.9s, 0.9s, 0.9s, 0.5s, 0.5s, 0.5s, 0.5s",
            transitionTimingFunction: REVEAL_EASE,
            willChange: "transform",
          }}
        >
          <Link href="/" className="flex items-center px-3">
            <Image
              src="/kov/brand/kov-wordmark-bone.png"
              alt="KOV"
              width={1116}
              height={209}
              className="h-5 w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-3 sm:gap-8 px-3 sm:px-4 text-xs uppercase tracking-widest text-kov-bone">
            <NavLinks links={LINKS} pillRef={pillRef} />
          </nav>

          <div className="hidden md:flex items-center gap-1 pr-1">
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
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="md:hidden flex flex-col justify-center items-end gap-1.5 w-11 h-11 px-3"
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
      </div>

      <MobileNavMenu open={mobileOpen} onClose={() => setMobileOpen(false)} links={LINKS} />
    </>
  );
}
