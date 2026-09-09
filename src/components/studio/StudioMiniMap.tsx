"use client";

import type { StudioNode } from "@/config/studio/studioNodes";

interface StudioMiniMapProps {
  nodes: StudioNode[];
  activeId: string;
  onSelectRoom: (id: string) => void;
}

// A room selector presented as a map, not a literal floor plan — only two
// rooms have a real spatial relationship to each other today (see their
// own `connections` in studioNodes.ts), so this never invents a layout
// for the four still waiting on a real panorama; it just groups every
// room as a dot, red/available or dim/"bientôt", same room set and order
// as StudioRoomCarousel below.
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
      <div className="grid grid-cols-3 gap-x-5 gap-y-3 w-[168px]">
        {nodes.map((node) => {
          const isActive = node.id === activeId;
          return (
            <div key={node.id} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                disabled={!node.available}
                onClick={() => onSelectRoom(node.id)}
                aria-label={node.name}
                aria-current={isActive}
                className="relative w-3.5 h-3.5 rounded-full transition-transform disabled:cursor-default enabled:hover:scale-125"
                style={{
                  background: isActive ? "var(--kov-red)" : "transparent",
                  border: node.available ? "1.5px solid var(--kov-red)" : "1px solid var(--glass-border)",
                  opacity: node.available ? 1 : 0.4,
                }}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full animate-ping motion-reduce:animate-none"
                    style={{ background: "var(--kov-red)", opacity: 0.5 }}
                  />
                )}
              </button>
              <span
                className="text-[8px] uppercase tracking-widest"
                style={{ color: isActive ? "var(--kov-bone)" : "var(--kov-steel)" }}
              >
                {node.room}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
