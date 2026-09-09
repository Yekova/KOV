"use client";

import type { StudioNode } from "@/config/studio/studioNodes";

interface StudioMiniMapProps {
  nodes: StudioNode[];
  activeId: string;
  onSelectRoom: (id: string) => void;
}

// Invented floor-plan geometry, by explicit request — not a survey of the
// real studio. Indexed to STUDIO_NODE_ORDER: P01/P02 sit stacked on the
// spine (they're the one real, connected pair today), P03-P06 branch off
// it two-by-two — a placeholder layout to swap for real coordinates once
// those rooms exist for real.
const VIEWBOX_W = 200;
const VIEWBOX_H = 260;
const ROOM_LAYOUT = [
  { x: 65, y: 205, w: 70, h: 45 }, // p01
  { x: 65, y: 150, w: 70, h: 45 }, // p02
  { x: 15, y: 95, w: 55, h: 40 }, // p03
  { x: 130, y: 95, w: 55, h: 40 }, // p04
  { x: 15, y: 40, w: 55, h: 40 }, // p05
  { x: 130, y: 40, w: 55, h: 40 }, // p06
];

export function StudioMiniMap({ nodes, activeId, onSelectRoom }: StudioMiniMapProps) {
  return (
    <div
      className="absolute top-20 right-6 md:top-24 md:right-8 p-4"
      style={{
        borderRadius: 16,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      <p className="text-[9px] uppercase tracking-widest text-kov-steel mb-3">Carte du studio</p>
      <svg width={180} height={234} viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}>
        <line x1="100" y1="150" x2="100" y2="40" stroke="var(--glass-border)" strokeWidth="2" />
        <line x1="70" y1="115" x2="130" y2="115" stroke="var(--glass-border)" strokeWidth="2" />
        <line x1="70" y1="60" x2="130" y2="60" stroke="var(--glass-border)" strokeWidth="2" />

        {nodes.map((node, i) => {
          const layout = ROOM_LAYOUT[i];
          if (!layout) return null;
          const isActive = node.id === activeId;
          const cx = layout.x + layout.w / 2;
          const cy = layout.y + layout.h / 2;

          return (
            <g key={node.id}>
              <rect
                x={layout.x}
                y={layout.y}
                width={layout.w}
                height={layout.h}
                rx={4}
                role="button"
                tabIndex={node.available ? 0 : -1}
                aria-label={node.name}
                aria-current={isActive || undefined}
                onClick={() => node.available && onSelectRoom(node.id)}
                onKeyDown={(e) => {
                  if (node.available && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelectRoom(node.id);
                  }
                }}
                style={{
                  fill: isActive
                    ? "rgba(227,30,36,0.25)"
                    : node.available
                      ? "rgba(227,30,36,0.08)"
                      : "rgba(255,255,255,0.03)",
                  stroke: node.available ? "var(--kov-red)" : "var(--glass-border)",
                  strokeWidth: isActive ? 2 : 1.5,
                  cursor: node.available ? "pointer" : "default",
                  outline: "none",
                }}
              />
              <text
                x={cx}
                y={cy + 3}
                fontSize="9"
                textAnchor="middle"
                fill={node.available ? "var(--kov-bone)" : "var(--kov-steel)"}
                style={{ pointerEvents: "none" }}
              >
                {node.room}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
