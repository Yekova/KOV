"use client";

import { Html, Line } from "@react-three/drei";
import { STUDIO_NODES, STUDIO_NODE_ORDER } from "@/config/studio/studioNodes";
import { STUDIO_MAP_LAYOUT, STUDIO_MAP_CENTER } from "@/config/studio/studioMapLayout";

interface StudioMapLabelsProps {
  currentRoomId: string;
}

// Expanded-mode-only labels floating just outside the building's
// silhouette, each tied back to its room by a fine leader line — kept
// off the mini HUD card (too small to read there, and StudioMapRoom's
// own hover tooltip already covers that context in mini mode).
//
// Phase-2 pass: a clearer hierarchy between the current room's label
// (larger, a real pill background, brighter leader line) and every other
// label (small, no background, dimmed further when unavailable) — the
// original had every label at the same weight, which read as noise
// rather than a hierarchy.
export function StudioMapLabels({ currentRoomId }: StudioMapLabelsProps) {
  return (
    <>
      {STUDIO_NODE_ORDER.map((id) => {
        const layout = STUDIO_MAP_LAYOUT[id];
        const node = STUDIO_NODES[id];
        if (!layout || !node) return null;

        const [rx, ry, rz] = layout.position;
        const [cx, , cz] = STUDIO_MAP_CENTER;
        const dx = rx - cx;
        const dz = rz - cz;
        const dist = Math.hypot(dx, dz) || 1;
        const nx = dx / dist;
        const nz = dz / dist;
        const anchor: [number, number, number] = [rx + nx * 2, ry + layout.size[1] + 1.05, rz + nz * 2];
        const edgePoint: [number, number, number] = [
          rx + nx * (layout.size[0] / 2),
          ry + layout.size[1],
          rz + nz * (layout.size[2] / 2),
        ];
        const isActive = id === currentRoomId;

        return (
          <group key={id}>
            <Line points={[edgePoint, anchor]} color={isActive ? "#e31e24" : "#3a3a3a"} lineWidth={isActive ? 1.4 : 0.8} />
            <Html position={anchor} center zIndexRange={[5, 0]} occlude={false}>
              {isActive ? (
                <div
                  className="pointer-events-none text-center whitespace-nowrap px-3 py-1.5"
                  style={{
                    borderRadius: 8,
                    background: "rgba(8,8,8,0.88)",
                    border: "1px solid rgba(227,30,36,0.35)",
                  }}
                >
                  <p className="text-kov-red text-[10px] font-mono tracking-widest">{node.room}</p>
                  <p className="text-kov-bone text-[11px] uppercase tracking-widest mt-0.5">{node.name}</p>
                </div>
              ) : (
                <div className="pointer-events-none text-center whitespace-nowrap" style={{ opacity: node.available ? 0.8 : 0.4 }}>
                  <p className="text-kov-steel text-[8px] font-mono tracking-widest">{node.room}</p>
                  <p className="text-kov-steel text-[8px] uppercase tracking-widest mt-0.5">{node.name}</p>
                </div>
              )}
            </Html>
          </group>
        );
      })}
    </>
  );
}
