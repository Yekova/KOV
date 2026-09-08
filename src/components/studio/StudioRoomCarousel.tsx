"use client";

import Image from "next/image";
import type { StudioNode } from "@/config/studio/studioNodes";

interface StudioRoomCarouselProps {
  nodes: StudioNode[];
  activeId: string;
  onSelectRoom: (id: string) => void;
}

// The board's bottom strip — one tile per room in STUDIO_NODE_ORDER.
// Available rooms show their real thumbnail (generated from the two real
// panoramas, see the scratch conversion script) and are clickable;
// unavailable ones are dimmed with an honest "Bientôt" badge instead of
// a fabricated preview, and aren't clickable at all.
export function StudioRoomCarousel({ nodes, activeId, onSelectRoom }: StudioRoomCarouselProps) {
  return (
    <div className="absolute bottom-16 md:bottom-20 inset-x-0 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-kov-bone text-sm">Explorer le studio</p>
          <p className="text-kov-steel text-[10px] uppercase tracking-widest">{nodes.length} salles · une même vision</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {nodes.map((node, i) => {
            const active = node.id === activeId;
            return (
              <button
                key={node.id}
                type="button"
                disabled={!node.available}
                onClick={() => onSelectRoom(node.id)}
                className="relative shrink-0 text-left overflow-hidden disabled:cursor-not-allowed"
                style={{
                  width: 168,
                  aspectRatio: "16 / 9",
                  borderRadius: 10,
                  border: active ? "1px solid var(--kov-red)" : "1px solid var(--glass-border)",
                  boxShadow: active ? "0 0 20px rgba(227,30,36,0.35)" : "none",
                  opacity: node.available ? 1 : 0.55,
                }}
              >
                {node.available ? (
                  <Image
                    src={`/studio/thumbnails/${node.id}.webp`}
                    alt=""
                    fill
                    sizes="168px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--kov-carbon)" }}>
                    <span className="text-kov-steel text-[9px] uppercase tracking-widest">Bientôt</span>
                  </div>
                )}
                <div
                  className="absolute inset-x-0 bottom-0 px-2.5 py-2"
                  style={{ background: "linear-gradient(180deg, transparent, rgba(5,5,5,0.85))" }}
                >
                  <p className="text-kov-bone text-[11px] leading-tight">
                    <span className="text-kov-red font-mono mr-1">{String(i + 1).padStart(2, "0")}</span>
                    {node.name}
                  </p>
                  <p className="text-kov-steel text-[9px] uppercase tracking-widest truncate">{node.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
