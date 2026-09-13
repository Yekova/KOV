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
        const anchor: [number, number, number] = [rx + nx * 1.7, ry + layout.size[1] + 0.9, rz + nz * 1.7];
        const edgePoint: [number, number, number] = [
          rx + nx * (layout.size[0] / 2),
          ry + layout.size[1],
          rz + nz * (layout.size[2] / 2),
        ];
        const isActive = id === currentRoomId;

        return (
          <group key={id}>
            <Line points={[edgePoint, anchor]} color={isActive ? "#e31e24" : "#4a4a4a"} lineWidth={1} />
            <Html position={anchor} center zIndexRange={[5, 0]} occlude={false}>
              <div className="pointer-events-none text-center whitespace-nowrap">
                <p className={`text-[9px] font-mono tracking-widest ${isActive ? "text-kov-red" : "text-kov-steel"}`}>
                  {node.room}
                </p>
                <p
                  className={`text-[9px] uppercase tracking-widest ${isActive ? "text-kov-bone" : "text-kov-steel"}`}
                  style={{ opacity: node.available ? 1 : 0.5 }}
                >
                  {node.name}
                </p>
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}
