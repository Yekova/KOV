"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";
import { GlassSurface } from "@/components/ui/GlassSurface";
import type { StudioConnection } from "@/config/studio/studioNodes";

const HOTSPOT_SIZE = 56;

interface HotspotProps {
  connection: StudioConnection;
  disabled: boolean;
  onSelect: (targetNodeId: string) => void;
}

// Anchored to a real 3D position via drei's <Html> — it projects world
// coordinates to screen space every frame, which is what makes this an
// actual 3D object rather than a `position: absolute; left: 60%` guess
// (studio spec §23). A real <button> underneath (not a styled <div>), so
// Tab/Enter reach it exactly like any other interactive element — no
// separate invisible keyboard-nav layer needed (studio spec §39).
export function Hotspot({ connection, disabled, onSelect }: HotspotProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Html position={connection.position} center zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(connection.targetNodeId)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={`Avancer vers ${connection.label}`}
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
          <path d="M12 19V5M5 12l7-7 7 7" />
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
          {connection.label}
        </span>
      </button>
    </Html>
  );
}
