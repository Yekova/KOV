import type { StudioRoomType } from "@/config/studio/studioMapFurniture";
import type { StudioMapMaterialKey } from "@/config/studio/studioMapMaterials";

// Architectural data for the 3D map. Identity, names, availability and the
// real connection graph still come from STUDIO_NODES (studioNodes.ts) —
// this file adds only what doesn't exist there: where each room sits in a
// shared floor plan, how its walls/openings/windows are built, and which
// furniture + lighting preset it uses.
//
// The plan is one contiguous building in three bands rather than separate
// volumes scattered on a platform (which is what made the previous pass
// read as blocks rather than architecture):
//
//        z=-4.6  ┌────────┬──────────┬────────┐
//                │  P04   │   P02    │  P05   │   band C (north)
//        z=-1.6  ├────────┴──┬───┬───┴────────┤
//                │    P03    │ ▓ │    P06     │   band B (middle)
//        z= 1.6  ├───────────┴───┴────────────┤   ▓ = corridor + stair core
//                │          P01               │   band A (south, entrance)
//        z= 4.2  └────────────────────────────┘
//               x=-4.2                       x=4.2
//
// P07 (Rooftop) sits on level 1 directly above the west half, reached by
// the stair core in the corridor.
export type WallSide = "north" | "south" | "east" | "west";

export interface WallOpening {
  side: WallSide;
  /** Centre of the gap, measured along the wall from the wall's midpoint. */
  offset: number;
  width: number;
}

export interface WallWindow extends WallOpening {
  /** Height of the solid sill under the glass; the glass fills from there
   * to the top of the wall. */
  sill: number;
}

export interface RoomArchitecture {
  wallThickness: number;
  /** Cutaway height for the walls nearest the camera (south/east) — low
   * enough to see the whole interior. */
  cutHeight: number;
  /** The far walls (north/west) stay taller so the model still reads as
   * having a façade rather than being a floor plan with kerbs. */
  backHeight: number;
  openings: WallOpening[];
  windows: WallWindow[];
  /** Sides with no wall at all. */
  openSides?: WallSide[];
  /** Rooftop terraces get a low parapet instead of walls. */
  parapet?: number;
}

export type LightingPreset = "warm" | "neutral" | "accent" | "dim" | "outdoor";

export interface StudioMapLayoutEntry {
  /** [x, y, z] centre of the room's footprint; y is its floor level. */
  position: [number, number, number];
  /** [width, depth] — height now comes from `architecture`. */
  footprint: [number, number];
  level: 0 | 1;
  type: StudioRoomType;
  floorMaterial: StudioMapMaterialKey;
  lighting: LightingPreset;
  architecture: RoomArchitecture;
  /** Fixed world position for this room's label, so labels never stack on
   * top of each other regardless of camera angle (the previous
   * direction-from-centre approach collapsed for rooms near the middle). */
  labelAnchor: [number, number, number];
}

const WALL = 0.1;
const CUT = 0.95;
const BACK = 1.45;
export const LEVEL_1_HEIGHT = 1.6;

export const STUDIO_MAP_LAYOUT: Record<string, StudioMapLayoutEntry> = {
  // Band A — the lobby, with the glazed entrance façade facing south.
  p01: {
    position: [0, 0, 2.9],
    footprint: [4.4, 2.6],
    level: 0,
    type: "portal",
    floorMaterial: "floorStone",
    lighting: "warm",
    labelAnchor: [0.6, 1.5, 6.1],
    architecture: {
      wallThickness: WALL,
      cutHeight: CUT,
      backHeight: BACK,
      openings: [
        { side: "north", offset: 0, width: 1.8 },
        { side: "south", offset: 0, width: 1.3 },
      ],
      windows: [
        { side: "south", offset: -1.5, width: 1.5, sill: 0.1 },
        { side: "south", offset: 1.5, width: 1.5, sill: 0.1 },
        { side: "east", offset: 0, width: 1.6, sill: 0.35 },
        { side: "west", offset: 0, width: 1.6, sill: 0.35 },
      ],
    },
  },
  // Band B west — gallery, opening onto the corridor.
  p03: {
    position: [-2.8, 0, 0],
    footprint: [2.8, 3.2],
    level: 0,
    type: "gallery",
    floorMaterial: "floorConcrete",
    lighting: "accent",
    labelAnchor: [-6.4, 1.3, 1.6],
    architecture: {
      wallThickness: WALL,
      cutHeight: CUT,
      backHeight: BACK,
      openings: [{ side: "east", offset: 0, width: 1.4 }],
      windows: [{ side: "west", offset: 0, width: 2, sill: 0.45 }],
    },
  },
  // Band B east — lounge, glazed toward the outside.
  p06: {
    position: [2.8, 0, 0],
    footprint: [2.8, 3.2],
    level: 0,
    type: "lounge",
    floorMaterial: "floorWood",
    lighting: "warm",
    labelAnchor: [6.6, 1.3, 1.4],
    architecture: {
      wallThickness: WALL,
      cutHeight: CUT,
      backHeight: BACK,
      openings: [{ side: "west", offset: 0, width: 1.4 }],
      windows: [{ side: "east", offset: 0, width: 2.1, sill: 0.3 }],
    },
  },
  // Band C centre — the big open design studio, the hinge of the plan.
  p02: {
    position: [0, 0, -3.1],
    footprint: [3.6, 3],
    level: 0,
    type: "design",
    floorMaterial: "floorWood",
    lighting: "neutral",
    labelAnchor: [0, 2.1, -6.6],
    architecture: {
      wallThickness: WALL,
      cutHeight: CUT,
      backHeight: BACK,
      openings: [
        { side: "south", offset: 0, width: 1.8 },
        { side: "west", offset: 0, width: 1.1 },
        { side: "east", offset: 0, width: 1.1 },
      ],
      windows: [{ side: "north", offset: 0, width: 2.6, sill: 0.35 }],
    },
  },
  // Band C west — motion room, deliberately the darkest box.
  p04: {
    position: [-3, 0, -3.1],
    footprint: [2.4, 3],
    level: 0,
    type: "motion",
    floorMaterial: "floorCarpet",
    lighting: "dim",
    labelAnchor: [-6.6, 1.6, -4.2],
    architecture: {
      wallThickness: WALL,
      cutHeight: CUT,
      backHeight: BACK,
      openings: [{ side: "east", offset: 0, width: 1.1 }],
      windows: [{ side: "west", offset: 0.6, width: 1, sill: 0.6 }],
    },
  },
  // Band C east — dev lab.
  p05: {
    position: [3, 0, -3.1],
    footprint: [2.4, 3],
    level: 0,
    type: "devlab",
    floorMaterial: "floorConcrete",
    lighting: "neutral",
    labelAnchor: [6.6, 1.6, -4.2],
    architecture: {
      wallThickness: WALL,
      cutHeight: CUT,
      backHeight: BACK,
      openings: [{ side: "west", offset: 0, width: 1.1 }],
      windows: [{ side: "east", offset: 0, width: 1.8, sill: 0.4 }],
    },
  },
  // Level 1 — a real terrace slab resting on the columns + stair core
  // below, not a rectangle floating next to the building.
  p07: {
    position: [-1.2, LEVEL_1_HEIGHT, -0.6],
    footprint: [4.6, 3.8],
    level: 1,
    type: "rooftop",
    floorMaterial: "floorDeck",
    lighting: "outdoor",
    labelAnchor: [-5.4, 3.5, 3.6],
    architecture: {
      wallThickness: 0.08,
      cutHeight: 0.34,
      backHeight: 0.34,
      openings: [],
      windows: [],
      openSides: ["north", "south", "east", "west"],
      parapet: 0.34,
    },
  },
};

// The circulation spine: lobby → corridor → design studio, with the
// gallery and lounge opening onto it from either side.
export const STUDIO_CORRIDOR = {
  position: [0, 0, 0] as [number, number, number],
  footprint: [2.8, 3.2] as [number, number],
};

// Compact stair core inside the corridor, rising to the terrace.
export const STUDIO_STAIR = {
  position: [0.85, 0, 0.9] as [number, number, number],
  footprint: [0.95, 1.2] as [number, number],
  steps: 8,
  height: LEVEL_1_HEIGHT,
};

// Columns carrying the terrace slab — placed at the corners of P07's
// footprint so it visibly rests on the building.
export const STUDIO_COLUMNS: Array<[number, number]> = [
  [-3.3, -2.3],
  [0.9, -2.3],
  [-3.3, 1.1],
  // Pulled back from the terrace's SE corner so it doesn't sit inside the
  // stair core's own footprint (which starts at z = 0.3).
  [0.9, -0.1],
];

export const STUDIO_BUILDING_BOUNDS = {
  min: [-4.2, 0, -4.6] as [number, number, number],
  max: [4.2, LEVEL_1_HEIGHT + 0.4, 4.2] as [number, number, number],
};

export const STUDIO_MAP_CENTER: [number, number, number] = [0, 0.55, -0.4];
