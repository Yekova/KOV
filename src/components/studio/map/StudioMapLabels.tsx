"use client";

import { Html, Line } from "@react-three/drei";
import { STUDIO_NODES, STUDIO_NODE_ORDER } from "@/config/studio/studioNodes";
import { STUDIO_MAP_LAYOUT } from "@/config/studio/studioMapLayout";

interface StudioMapLabelsProps {
  currentRoomId: string;
  selectedId: string | null;
  hoveredId: string | null;
  selectedLevel: number | null;
}

// Expanded-mode-only labels, anchored at fixed world positions declared in
// studioMapLayout.ts rather than derived from a direction vector — the
// derived version collapsed for rooms near the centre of the plan and
// stacked labels on top of each other. Exactly one label per room, and
// StudioMapRoom's hover tooltip is disabled in this mode so a hovered
// room never shows its name twice.
export function StudioMapLabels({ currentRoomId, selectedId, hoveredId, selectedLevel }: StudioMapLabelsProps) {
  return (
    <>
      {STUDIO_NODE_ORDER.map((id) => {
        const layout = STUDIO_MAP_LAYOUT[id];
        const node = STUDIO_NODES[id];
        if (!layout || !node) return null;
        // A level filtered out of view doesn't get labels either, so the
        // faded floor doesn't leave orphaned text hanging over the model.
        if (selectedLevel !== null && layout.level !== selectedLevel) return null;

        const [rx, ry, rz] = layout.position;
        const anchor = layout.labelAnchor;
        const top: [number, number, number] = [rx, ry + layout.architecture.backHeight + 0.1, rz];
        const isActive = id === currentRoomId;
        const isPrimary = isActive || id === selectedId || id === hoveredId;

        return (
          <group key={id}>
            <Line
              points={[top, anchor]}
              color={isActive ? "#e31e24" : isPrimary ? "#8a857c" : "#3d3b37"}
              lineWidth={isActive ? 1.4 : 1}
            />
            <Html position={anchor} center zIndexRange={[5, 0]} occlude={false}>
              {isActive ? (
                <div
                  className="pointer-events-none text-center whitespace-nowrap px-3 py-1.5"
                  style={{
                    borderRadius: 8,
                    background: "rgba(8,8,8,0.9)",
                    border: "1px solid rgba(227,30,36,0.4)",
                  }}
                >
                  <p className="text-kov-red text-[10px] font-mono tracking-widest">{node.room}</p>
                  <p className="text-kov-bone text-[11px] uppercase tracking-widest mt-0.5">{node.name}</p>
                </div>
              ) : (
                <div
                  className="pointer-events-none text-center whitespace-nowrap"
                  style={{ opacity: !node.available ? 0.35 : isPrimary ? 0.95 : 0.62 }}
                >
                  <p className={`text-[9px] font-mono tracking-widest ${isPrimary ? "text-kov-red" : "text-kov-steel"}`}>
                    {node.room}
                  </p>
                  <p className={`text-[9px] uppercase tracking-widest ${isPrimary ? "text-kov-bone" : "text-kov-steel"}`}>
                    {node.name}
                  </p>
                </div>
              )}
            </Html>
          </group>
        );
      })}
    </>
  );
}
