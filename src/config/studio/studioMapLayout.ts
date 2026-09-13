// Purely spatial data for the 3D architectural map (StudioMap3D and
// friends) — identity, names, subtitles, availability and the real
// connection graph all still come from STUDIO_NODES (studioNodes.ts) as
// the single source of truth. This file only adds the one thing that
// doesn't exist anywhere yet: where each room sits on a shared building
// floor-plan. (StudioConnection.position elsewhere is a hotspot position
// *inside* a room's own panorama sphere, not a building-wide coordinate —
// a genuinely different thing, not a duplicate of it.)
//
// Invented geometry, same "you can invent the layout for now" latitude
// already used by StudioMiniMap.tsx's own 2D floor plan — a schematic
// cross plan with the Portal as the hub: Design Studio to the north,
// Lounge east, Rooftop west and one level up (it's the one room that's
// actually meant to read as "upstairs"), and the three not-yet-real rooms
// grouped south as a dimmed, disconnected future wing.
export interface StudioMapLayoutEntry {
  /** [x, y, z] center of the room's volume. y is floor level height. */
  position: [number, number, number];
  /** [width, height, depth] of the room's box. */
  size: [number, number, number];
  /** 0 = ground floor, 1 = one floor up — purely for the visual riser/
   * label ("Niveau 1"), not a physical stacking of boxes. */
  level: number;
}

export const STUDIO_MAP_LAYOUT: Record<string, StudioMapLayoutEntry> = {
  p01: { position: [0, 0, 0], size: [2.4, 0.4, 2.4], level: 0 },
  p02: { position: [0, 0, -3.4], size: [2.8, 0.4, 2.2], level: 0 },
  p03: { position: [-2, 0, 3.6], size: [1.8, 0.35, 1.6], level: 0 },
  p04: { position: [0, 0, 4.2], size: [1.8, 0.35, 1.6], level: 0 },
  p05: { position: [2, 0, 3.6], size: [1.8, 0.35, 1.6], level: 0 },
  p06: { position: [3.4, 0, 0.6], size: [2.4, 0.4, 2], level: 0 },
  p07: { position: [-3.4, 1.6, 0.6], size: [2.4, 0.4, 2], level: 1 },
};

// Rough centroid of the developed cluster (excludes the future south
// wing, which is intentionally off to the side) — what the map's camera
// looks at.
export const STUDIO_MAP_CENTER: [number, number, number] = [0, 0.3, -0.6];
