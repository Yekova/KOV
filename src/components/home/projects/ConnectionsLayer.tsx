"use client";

export interface Connection {
  id: string;
  /** Cubic bezier from the card's edge to the hub's edge. */
  d: string;
  /** Where the card end of the line meets the card. */
  nodeX: number;
  nodeY: number;
}

interface ConnectionsLayerProps {
  connections: Connection[];
  width: number;
  height: number;
  hoveredId: string | null;
  hubLit: boolean;
  drawn: boolean;
  reducedMotion: boolean;
}

const DRAW_MS = 1000;

// The lines, drawn in the section's own coordinate space.
//
// Every path is computed from real measured positions rather than from
// hardcoded coordinates, so the network survives any change to the card
// sizes, the gaps, or the window — which is the one thing that reliably
// breaks a diagram like this.
export function ConnectionsLayer({
  connections,
  width,
  height,
  hoveredId,
  hubLit,
  drawn,
  reducedMotion,
}: ConnectionsLayerProps) {
  if (width === 0 || height === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      {connections.map((connection, i) => {
        const active = hoveredId === connection.id;
        return (
          <g key={connection.id}>
            <path
              d={connection.d}
              fill="none"
              strokeLinecap="round"
              stroke={active ? "var(--kov-red)" : "rgba(255,255,255,0.18)"}
              strokeWidth={1}
              // pathLength normalises every path to 1 regardless of its real
              // length, so all six draw in the same time instead of the long
              // ones lagging.
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={drawn || reducedMotion ? 0 : 1}
              style={{
                opacity: active ? 1 : hubLit ? 0.85 : hoveredId ? 0.4 : 0.65,
                transition: reducedMotion
                  ? "stroke 260ms ease, opacity 260ms ease"
                  : `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.22,1,0.36,1) ${i * 90}ms, stroke 260ms ease, opacity 260ms ease`,
              }}
            />
            <circle
              cx={connection.nodeX}
              cy={connection.nodeY}
              r={active ? 4 : 3}
              fill={active ? "var(--kov-red)" : "rgba(12,12,13,1)"}
              stroke={active ? "var(--kov-red)" : "rgba(255,255,255,0.35)"}
              strokeWidth={1}
              style={{
                opacity: drawn || reducedMotion ? 1 : 0,
                transition: `opacity 400ms ease ${DRAW_MS * 0.6 + i * 90}ms, fill 240ms ease, stroke 240ms ease, r 240ms ease`,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
