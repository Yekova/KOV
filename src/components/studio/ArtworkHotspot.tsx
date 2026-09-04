"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";
import { GlassSurface } from "@/components/ui/GlassSurface";
import type { StudioArtwork } from "@/config/studio/studioNodes";

const HOTSPOT_SIZE = 48;

interface ArtworkHotspotProps {
  artwork: StudioArtwork;
  disabled: boolean;
  onSelect: (artwork: StudioArtwork) => void;
}

// Same 3D-anchoring/keyboard-accessible pattern as Hotspot.tsx (real
// <button>, drei <Html> projecting a world position to screen space every
// frame), but visually a framed square instead of a round "advance" arrow
// — and opens a project presentation panel instead of navigating rooms, so
// it needs to read as "inspect", not "go here".
export function ArtworkHotspot({ artwork, disabled, onSelect }: ArtworkHotspotProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Html position={artwork.position} center zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(artwork)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={`Voir le projet ${artwork.project.name}`}
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
          borderRadius={6}
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
          <rect x="3" y="3" width="18" height="18" rx="1.5" />
          <circle cx="9" cy="9.5" r="1.5" />
          <path d="M21 15l-5-5-11 11" />
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
          {artwork.project.name}
        </span>
      </button>
    </Html>
  );
}
