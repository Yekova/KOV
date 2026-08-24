"use client";

import { useRef, useState, type ReactNode, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiquidRect } from "@/lib/useLiquidRect";
import { LiquidBlob } from "@/components/ui/LiquidBlob";
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

const BLOB_PADDING_X = 20;
const BLOB_HEIGHT = 30;
const CLOSE_DELAY_MS = 200;

// A red "liquid" blob flows between nav links on hover (see LiquidBlob.tsx).
// Two of the four links (Expertise, Studio) additionally open a portaled
// "expanding card" panel on hover/focus — see NavDropdownPanel.tsx. Projets
// and Journal stay plain links: neither has real sub-content to fan out into
// a dropdown (one real project + placeholders; no post category taxonomy).
export function NavLinks({ links, pillRef }: { links: NavLinkItem[]; pillRef: RefObject<HTMLDivElement | null> }) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [displayKey, setDisplayKey] = useState<string | null>(null);
  const [anchorTop, setAnchorTop] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIndex = links.findIndex((link) => {
    const path = link.href.split("#")[0] || "/";
    return path === pathname;
  });
  const targetIndex = hoveredIndex ?? (activeIndex >= 0 ? activeIndex : null);

  const { containerRef, itemRefs, rect } = useLiquidRect<HTMLAnchorElement>(targetIndex);

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
      ref={containerRef}
      className="relative flex items-center gap-3 sm:gap-8"
      onMouseLeave={() => {
        setHoveredIndex(null);
        if (activeKey) scheduleClose();
      }}
    >
      <LiquidBlob rect={rect} height={BLOB_HEIGHT} paddingX={BLOB_PADDING_X} />

      {links.map((link, index) => (
        <Link
          key={link.href}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          href={link.href}
          onMouseEnter={() => {
            setHoveredIndex(index);
            if (link.dropdownKey) openDropdown(link.dropdownKey);
            else if (activeKey) scheduleClose();
          }}
          aria-haspopup={link.dropdownKey ? "true" : undefined}
          aria-expanded={link.dropdownKey ? activeKey === link.dropdownKey : undefined}
          className="relative z-10 transition-colors"
          style={{ color: index === targetIndex ? "var(--kov-white)" : undefined }}
        >
          {link.label}
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
