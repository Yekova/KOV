import type { StudioRoomType } from "@/config/studio/studioMapFurniture";
import type { StudioMapMaterialKey } from "@/config/studio/studioMapMaterials";

// Purely spatial/architectural data for the 3D map (StudioMap3D and
// friends) — identity, names, subtitles, availability and the real
// connection graph all still come from STUDIO_NODES (studioNodes.ts) as
// the single source of truth. This file only adds what doesn't exist
// anywhere yet: where each room sits on a shared building floor-plan, how
// tall its (cutaway) walls stand, which side its doorway opens on, and
// which furniture/floor-material set it gets. StudioMapRoom.tsx reads
// `type`/`doorSide`/`floorMaterial` generically — nothing in the render
// code branches on a literal room id.
//
// Invented geometry, same "you can invent the layout for now" latitude
// used throughout this Studio build — a schematic cross plan with the
// Portal as the open-plan hub: Design Studio north, Lounge east, Rooftop
// west and one level up, the three not-yet-real rooms grouped south as a
// dimmed, disconnected future wing.
export interface StudioMapLayoutEntry {
  /** [x, y, z] center of the room's footprint. y is floor level height. */
  position: [number, number, number];
  /** [width, wallHeight, depth] — wallHeight is the cutaway wall's
   * height (rooms have no ceiling), not a solid volume's thickness. */
  size: [number, number, number];
  /** 0 = ground floor, 1 = one floor up. */
  level: number;
  type: StudioRoomType;
  /** Which wall gets the doorway gap. "all" (Portal only) skips three
   * of the four walls entirely — an open reception hall rather than a
   * fourth enclosed room. */
  doorSide: "north" | "south" | "east" | "west" | "all";
  floorMaterial: StudioMapMaterialKey;
}

export const STUDIO_MAP_LAYOUT: Record<string, StudioMapLayoutEntry> = {
  p01: {
    position: [0, 0, 0],
    size: [2.4, 0.85, 2.4],
    level: 0,
    type: "portal",
    doorSide: "all",
    floorMaterial: "floorStone",
  },
  p02: {
    position: [0, 0, -3.4],
    size: [2.8, 0.9, 2.2],
    level: 0,
    type: "design",
    doorSide: "south",
    floorMaterial: "floorWood",
  },
  p03: {
    position: [-2, 0, 3.6],
    size: [1.8, 0.75, 1.6],
    level: 0,
    type: "gallery",
    doorSide: "north",
    floorMaterial: "floorStone",
  },
  p04: {
    position: [0, 0, 4.2],
    size: [1.8, 0.75, 1.6],
    level: 0,
    type: "motion",
    doorSide: "north",
    floorMaterial: "floorCarpet",
  },
  p05: {
    position: [2, 0, 3.6],
    size: [1.8, 0.75, 1.6],
    level: 0,
    type: "devlab",
    doorSide: "north",
    floorMaterial: "floorStone",
  },
  p06: {
    position: [3.4, 0, 0.6],
    size: [2.4, 0.8, 2],
    level: 0,
    type: "lounge",
    doorSide: "west",
    floorMaterial: "floorCarpet",
  },
  p07: {
    position: [-3.4, 1.6, 0.6],
    size: [2.4, 0.55, 2],
    level: 1,
    type: "rooftop",
    doorSide: "east",
    floorMaterial: "floorStone",
  },
};

// Rough centroid of the developed cluster (excludes the future south
// wing, which is intentionally off to the side) — what the map's camera
// looks at.
export const STUDIO_MAP_CENTER: [number, number, number] = [0, 0.3, -0.6];
