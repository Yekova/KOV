"use client";

import { STUDIO_NODES, STUDIO_NODE_ORDER } from "@/config/studio/studioNodes";

interface StudioMapAccessibleNavProps {
  currentRoomId: string;
  onSelect: (id: string) => void;
  /** False renders this as the real, visible UI instead of a sr-only
   * layer — used by StudioMap3D's error boundary fallback when the 3D
   * scene itself fails to render, so navigation never breaks even then. */
  visuallyHidden?: boolean;
}

// A real semantic list of room buttons, always present alongside the 3D
// canvas — Tab cycles rooms, Enter/Space selects, exactly like any other
// button on the page. Doubles as the fallback UI (see StudioMap3D.tsx's
// error boundary) if the 3D map fails to render for any reason: this list
// alone is enough to keep Studio navigation fully working.
export function StudioMapAccessibleNav({ currentRoomId, onSelect, visuallyHidden = true }: StudioMapAccessibleNavProps) {
  return (
    <nav aria-label="Navigation entre les salles du studio" className={visuallyHidden ? "sr-only" : undefined}>
      <ul className={visuallyHidden ? undefined : "space-y-1.5"}>
        {STUDIO_NODE_ORDER.map((id) => {
          const node = STUDIO_NODES[id];
          const isActive = id === currentRoomId;
          return (
            <li key={id}>
              <button
                type="button"
                disabled={!node.available}
                aria-current={isActive || undefined}
                onClick={() => node.available && onSelect(id)}
                className={
                  visuallyHidden
                    ? undefined
                    : "w-full text-left px-3 py-2.5 flex items-center gap-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
                }
                style={
                  visuallyHidden
                    ? undefined
                    : {
                        borderRadius: 10,
                        background: isActive ? "rgba(227,30,36,0.14)" : "transparent",
                        border: `1px solid ${isActive ? "var(--kov-red)" : "var(--glass-border)"}`,
                      }
                }
              >
                {!visuallyHidden && (
                  <span className="text-kov-red text-[10px] font-mono tracking-widest shrink-0">{node.room}</span>
                )}
                <span className={!visuallyHidden ? "text-kov-bone text-xs uppercase tracking-widest" : undefined}>
                  {visuallyHidden ? `${node.room} — ${node.name}` : node.name}
                </span>
                {!visuallyHidden && !node.available && (
                  <span className="ml-auto text-kov-steel text-[9px] uppercase tracking-widest">Bientôt</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
