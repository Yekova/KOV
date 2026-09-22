"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { StudioNode } from "@/config/studio/studioNodes";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface StudioRoomCarouselProps {
  nodes: StudioNode[];
  activeId: string;
  onSelectRoom: (id: string) => void;
  /** Room-specific control parked at the end of the strip, level with the
   * thumbnails — currently the Lounge's MP3 player. It sits outside the
   * scrolling row rather than inside it, for two reasons: it must not
   * scroll out of reach, and anything it opens has to be able to overflow
   * upward past the row's own `overflow-x: auto` clipping. */
  trailing?: ReactNode;
}

// The board's bottom strip — one tile per room in STUDIO_NODE_ORDER.
// Available rooms show their real thumbnail (generated from the two real
// panoramas, see the scratch conversion script) and are clickable;
// unavailable ones are dimmed with an honest "Bientôt" badge instead of
// a fabricated preview, and aren't clickable at all.
export function StudioRoomCarousel({ nodes, activeId, onSelectRoom, trailing }: StudioRoomCarouselProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  // Same contract as the room panel: null defers to the breakpoint's own
  // default, so rotating a phone to landscape opens the strip for anyone who
  // has not expressed a preference. On a portrait phone the strip plus its
  // header ate a third of the screen before anyone asked for it.
  const [override, setOverride] = useState<boolean | null>(null);
  const stripOpen = override ?? !isMobile;

  return (
    <div className="absolute bottom-16 md:bottom-20 inset-x-0 px-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-baseline justify-between mb-3">
          {/* A button on a phone, a heading on a desktop: the strip is worth
              its space on a wide screen and is worth a tap on a narrow one. */}
          <button
            type="button"
            onClick={() => setOverride(!stripOpen)}
            aria-expanded={stripOpen}
            className="md:pointer-events-none flex items-center gap-2 text-kov-bone text-sm"
          >
            Explorer le studio
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="md:hidden transition-transform duration-300"
              style={{ transform: stripOpen ? "rotate(180deg)" : "none" }}
            />
          </button>
          <p className="text-kov-steel text-[10px] uppercase tracking-widest">{nodes.length} salles · une même vision</p>
        </div>
        <div className="flex items-end gap-3">
          <div
            data-tour="rooms"
            className="flex gap-3 overflow-x-auto pb-1 min-w-0"
            style={{ scrollbarWidth: "none", display: stripOpen ? undefined : "none" }}
          >
            {nodes.map((node, i) => {
              const active = node.id === activeId;
              return (
                <button
                  key={node.id}
                  type="button"
                  disabled={!node.available}
                  onClick={() => onSelectRoom(node.id)}
                  // The name lives here rather than only in the overlay, so
                  // it is announced whether or not anything is hovered.
                  aria-label={
                    node.available
                      ? `${node.name} — ${node.subtitle}${active ? " (salle actuelle)" : ""}`
                      : `${node.name} — bientôt disponible`
                  }
                  aria-current={active ? "true" : undefined}
                  className="group relative shrink-0 text-left overflow-hidden disabled:cursor-not-allowed"
                  style={{
                    width: 168,
                    aspectRatio: "16 / 9",
                    borderRadius: 10,
                    border: active ? "1px solid var(--kov-red)" : "1px solid var(--glass-border)",
                    boxShadow: active ? "0 0 20px rgba(227,30,36,0.35)" : "none",
                    opacity: node.available ? 1 : 0.55,
                  }}
                >
                  {node.available && node.kind === "interactive-3d" ? (
                    /* A room that is not a photograph does not get one.
                       
                       This tile was pointing at /studio/thumbnails/p04.webp,
                       which has never existed and never will: the Brands
                       Gallery is geometry, and the honest cover for it is
                       its name set the way the mark is set. A render would
                       be a picture of the room taken from somewhere the
                       visitor cannot stand. */
                    <span
                      className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-2 transition-transform duration-500 group-hover:scale-105"
                      style={{ background: "linear-gradient(150deg, #101013 0%, #08080a 60%, #14090a 100%)" }}
                    >
                      <span
                        className="font-display text-kov-bone text-center leading-[1.05]"
                        style={{ fontSize: 15, letterSpacing: "-0.015em" }}
                      >
                        {node.name}
                      </span>
                      <span aria-hidden="true" className="block h-px w-6" style={{ background: "var(--kov-red)" }} />
                    </span>
                  ) : node.available ? (
                    <Image
                      src={`/studio/thumbnails/${node.id}.webp`}
                      alt=""
                      fill
                      sizes="168px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--kov-carbon)" }}>
                      <span className="text-kov-steel text-[9px] uppercase tracking-widest">Bientôt</span>
                    </div>
                  )}

                  {/* The active room has to be identifiable without hovering
                      it, so it keeps a mark — but a dot, not a caption. */}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--kov-red)", boxShadow: "0 0 8px var(--kov-red)" }}
                    />
                  )}

                  {/* Nothing but the photograph until you reach for it. The
                      captions used to sit permanently over every thumbnail,
                      two lines of small type on an uncontrolled background —
                      unreadable on a bright frame and noisy across seven
                      tiles at once. Now the tile darkens under the cursor and
                      the name arrives on a surface dark enough to carry it.
                      Touch devices, which have no hover to give, keep the
                      caption visible. */}
                  {node.available && (
                    <span
                      className="absolute inset-0 flex flex-col justify-end px-2.5 py-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                      style={{ background: "linear-gradient(180deg, rgba(5,5,5,0.25) 0%, rgba(5,5,5,0.88) 70%)" }}
                    >
                      <span className="block text-kov-bone text-[12px] leading-tight">
                        <span className="text-kov-red font-mono mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                        {node.name}
                      </span>
                      <span className="block text-kov-steel text-[9px] uppercase tracking-widest truncate mt-0.5">
                        {node.subtitle}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {trailing && <div className="shrink-0 pb-1">{trailing}</div>}
        </div>
      </div>
    </div>
  );
}
