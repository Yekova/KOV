"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";
import { GlassSurface } from "@/components/ui/GlassSurface";
import type { StudioInfoHotspot } from "@/config/studio/studioNodes";

const HOTSPOT_SIZE = 48;

interface InfoHotspotProps {
  hotspot: StudioInfoHotspot;
  disabled: boolean;
  onSelect: (hotspot: StudioInfoHotspot) => void;
}

// Same 3D-anchored, keyboard-accessible pattern as Hotspot.tsx/
// ArtworkHotspot.tsx — a real <button> inside drei's <Html>, GlassSurface
// circle, hover label — with an "info" glyph instead of an arrow/frame,
// and opening StudioInfoPanel (brand copy) instead of navigating or
// showing a project.
export function InfoHotspot({ hotspot, disabled, onSelect }: InfoHotspotProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Html position={hotspot.position} center zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(hotspot)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={hotspot.label}
        className="relative flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        style={{
          width: HOTSPOT_SIZE,
          height: HOTSPOT_SIZE,
          cursor: disabled ? "default" : "pointer",
          outlineColor: "var(--kov-red)",
          transform: hovered ? "translateY(-2px)" : "none",
          transition: "transform 0.3s ease",
        }}
      >
        <GlassSurface
          width={HOTSPOT_SIZE}
          height={HOTSPOT_SIZE}
          borderRadius={999}
          style={{
            position: "absolute",
            inset: 0,
            boxShadow: hovered
              ? "0 0 22px rgba(227, 30, 36, 0.4), var(--glass-shadow-full)"
              : "0 0 10px rgba(227, 30, 36, 0.12), var(--glass-shadow-full)",
          }}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--kov-bone)"
          strokeWidth="2"
          className="relative z-10"
          style={{ transform: hovered ? "translateY(-2px)" : "none", transition: "transform 0.3s ease" }}
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="11" x2="12" y2="16.5" />
          <circle cx="12" cy="7.5" r="0.6" fill="var(--kov-bone)" stroke="none" />
        </svg>

        <span
          role="presentation"
          className="absolute left-1/2 whitespace-nowrap text-[10px] uppercase tracking-widest text-kov-bone"
          style={{
            bottom: "calc(100% + 10px)",
            transform: hovered ? "translate(-50%, 0)" : "translate(-50%, 4px)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.25s ease, transform 0.25s ease",
            padding: "6px 12px",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {hotspot.label}
        </span>
      </button>
    </Html>
  );
}
