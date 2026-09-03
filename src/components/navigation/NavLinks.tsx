"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { NavDropdownPanel } from "@/components/navigation/NavDropdownPanel";
import { ExpertiseDropdown, StudioDropdown } from "@/components/navigation/NavDropdownContent";

export interface NavLinkItem {
  href: string;
  label: string;
  dropdownKey?: "expertise" | "studio";
}

const DROPDOWNS: Record<string, { width: number; render: (onNavigate: () => void) => ReactNode }> = {
  expertise: { width: 480, render: (onNavigate) => <ExpertiseDropdown onNavigate={onNavigate} /> },
  studio: { width: 380, render: (onNavigate) => <StudioDropdown onNavigate={onNavigate} /> },
};

const CLOSE_DELAY_MS = 200;
const EASE = "power3.out";

// Per-link hover treatment ported from reactbits.dev's PillNav (MIT) —
// replaces the old shared LiquidBlob-between-links effect (still used by
// Button.tsx's pill variant, untouched there) with a red circle that grows
// from each pill's own bottom edge on hover, pushing the label up and
// revealing a white one in its place. Kept in KOV's own glass pill
// container (Nav.tsx) and black/red palette — only the interaction
// mechanic and its chord-height circle math come from upstream, not
// PillNav's own flat baseColor/pillColor scheme.
export function NavLinks({ links, pillRef }: { links: NavLinkItem[]; pillRef: RefObject<HTMLDivElement | null> }) {
  const pathname = usePathname();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [displayKey, setDisplayKey] = useState<string | null>(null);
  const [anchorTop, setAnchorTop] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timelineRefs = useRef<(gsap.core.Timeline | null)[]>([]);
  const activeTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);

  const activeIndex = links.findIndex((link) => {
    const path = link.href.split("#")[0] || "/";
    return path === pathname;
  });

  // Chord-height math straight from upstream: the circle diameter/transform
  // -origin needed so a scale-0→1.2 grow fully covers the pill in a curved
  // arc from its bottom edge, not a plain rectangle wipe. Recomputed on
  // resize and once webfonts settle (pill widths shift with font metrics).
  useEffect(() => {
    function layout() {
      circleRefs.current.forEach((circle, index) => {
        const pill = itemRefs.current[index];
        if (!circle || !pill) return;

        const { width: w, height: h } = pill.getBoundingClientRect();
        if (w === 0 || h === 0) return;

        const R = (w * w / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;
        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

        const label = pill.querySelector<HTMLElement>(".pill-label");
        const hoverLabel = pill.querySelector<HTMLElement>(".pill-label-hover");
        if (label) gsap.set(label, { y: 0 });
        if (hoverLabel) gsap.set(hoverLabel, { y: h + 12, opacity: 0 });

        timelineRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease: EASE, overwrite: "auto" }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease: EASE, overwrite: "auto" }, 0);
        if (hoverLabel) {
          gsap.set(hoverLabel, { y: Math.ceil(h + 40), opacity: 0 });
          tl.to(hoverLabel, { y: 0, opacity: 1, duration: 2, ease: EASE, overwrite: "auto" }, 0);
        }
        timelineRefs.current[index] = tl;

        // The current page's pill sits permanently "filled" — no hover
        // needed to see which link is active.
        if (index === activeIndex) tl.progress(1);
      });
    }

    layout();
    window.addEventListener("resize", layout);
    document.fonts?.ready?.then(layout).catch(() => {});
    return () => window.removeEventListener("resize", layout);
  }, [links, activeIndex]);

  function handleEnter(index: number) {
    const tl = timelineRefs.current[index];
    if (!tl) return;
    activeTweenRefs.current[index]?.kill();
    activeTweenRefs.current[index] = tl.tweenTo(tl.duration(), { duration: 0.3, ease: EASE, overwrite: "auto" });
  }

  function handleLeave(index: number) {
    if (index === activeIndex) return;
    const tl = timelineRefs.current[index];
    if (!tl) return;
    activeTweenRefs.current[index]?.kill();
    activeTweenRefs.current[index] = tl.tweenTo(0, { duration: 0.25, ease: EASE, overwrite: "auto" });
  }

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openDropdown(key: string) {
    cancelClose();
    const pillRect = pillRef.current?.getBoundingClientRect();
    if (pillRect) setAnchorTop(pillRect.bottom + 12);
    setActiveKey(key);
    setDisplayKey(key);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveKey(null), CLOSE_DELAY_MS);
  }

  const openEntry = displayKey ? DROPDOWNS[displayKey] : null;

  return (
    <div
      className="relative flex items-center gap-1"
      onMouseLeave={() => {
        if (activeKey) scheduleClose();
      }}
    >
      {links.map((link, index) => (
        <Link
          key={link.href}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          href={link.href}
          onMouseEnter={() => {
            handleEnter(index);
            if (link.dropdownKey) openDropdown(link.dropdownKey);
            else if (activeKey) scheduleClose();
          }}
          onMouseLeave={() => handleLeave(index)}
          aria-haspopup={link.dropdownKey ? "true" : undefined}
          aria-expanded={link.dropdownKey ? activeKey === link.dropdownKey : undefined}
          aria-current={index === activeIndex ? "page" : undefined}
          className="relative inline-flex items-center justify-center px-4 py-2 overflow-hidden"
          style={{ borderRadius: "var(--radius-pill)" }}
        >
          <span
            aria-hidden="true"
            ref={(el) => {
              circleRefs.current[index] = el;
            }}
            className="absolute left-1/2 bottom-0 rounded-full pointer-events-none"
            style={{ background: "var(--kov-red)", zIndex: 1 }}
          />
          <span className="relative inline-block" style={{ zIndex: 2 }}>
            <span className="pill-label relative inline-block text-kov-bone transition-colors duration-300" style={{ zIndex: 2 }}>
              {link.label}
            </span>
            <span
              aria-hidden="true"
              className="pill-label-hover absolute left-0 top-0 inline-block text-kov-white"
              style={{ zIndex: 3 }}
            >
              {link.label}
            </span>
          </span>
        </Link>
      ))}

      {openEntry && (
        <NavDropdownPanel
          visible={activeKey !== null}
          anchorTop={anchorTop}
          width={openEntry.width}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {openEntry.render(() => setActiveKey(null))}
        </NavDropdownPanel>
      )}
    </div>
  );
}
