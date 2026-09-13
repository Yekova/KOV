import type { StudioMapMaterialKey } from "@/config/studio/studioMapMaterials";

export type FurnitureShape =
  | { kind: "box"; size: [number, number, number] }
  | { kind: "cylinder"; radiusTop: number; radiusBottom: number; height: number }
  | { kind: "sphere"; radius: number };

export interface FurnitureItem {
  shape: FurnitureShape;
  /** Local offset from the room's own center — not a world position. */
  position: [number, number, number];
  material: StudioMapMaterialKey;
  rotationY?: number;
}

export type StudioRoomType = "portal" | "design" | "gallery" | "motion" | "devlab" | "lounge" | "rooftop";

// Keyed by room *type*, not by room id — StudioMapRoom.tsx looks this up
// generically (`STUDIO_MAP_FURNITURE[layout.type]`), no `if id === "p01"`
// branching anywhere in the render code. Max ~8 very simple primitives
// per room by design (brief's own "5-12 objects, composition over
// polygon count" constraint) — a table is one solid box floor-to-
// tabletop height, not a top + four legs.
export const STUDIO_MAP_FURNITURE: Record<StudioRoomType, FurnitureItem[]> = {
  portal: [
    { shape: { kind: "box", size: [0.9, 0.28, 0.35] }, position: [0.3, 0.14, -0.5], material: "wood" },
    { shape: { kind: "box", size: [1.2, 0.4, 0.05] }, position: [0, 0.3, -1.02], material: "kovRed" },
    { shape: { kind: "cylinder", radiusTop: 0.12, radiusBottom: 0.14, height: 0.25 }, position: [-0.8, 0.12, 0.55], material: "wood" },
    { shape: { kind: "sphere", radius: 0.18 }, position: [-0.8, 0.32, 0.55], material: "foliage" },
    { shape: { kind: "box", size: [0.5, 0.15, 0.25] }, position: [0.7, 0.075, 0.6], material: "fabric" },
  ],
  design: [
    { shape: { kind: "box", size: [0.8, 0.35, 0.45] }, position: [-0.55, 0.175, -0.35], material: "wood" },
    { shape: { kind: "box", size: [0.8, 0.35, 0.45] }, position: [0.55, 0.175, -0.35], material: "wood" },
    { shape: { kind: "cylinder", radiusTop: 0.12, radiusBottom: 0.12, height: 0.3 }, position: [-0.55, 0.15, 0.25], material: "fabric" },
    { shape: { kind: "cylinder", radiusTop: 0.12, radiusBottom: 0.12, height: 0.3 }, position: [0.55, 0.15, 0.25], material: "fabric" },
    { shape: { kind: "box", size: [0.5, 0.35, 0.04] }, position: [0, 0.5, -1.05], material: "glass" },
  ],
  gallery: [
    { shape: { kind: "box", size: [0.04, 0.5, 0.6] }, position: [-1.05, 0.4, -0.3], material: "warmLight" },
    { shape: { kind: "box", size: [0.04, 0.5, 0.6] }, position: [-1.05, 0.4, 0.3], material: "kovRed" },
    { shape: { kind: "box", size: [0.6, 0.15, 0.3] }, position: [0.3, 0.075, 0], material: "fabric" },
  ],
  motion: [
    { shape: { kind: "box", size: [1.0, 0.55, 0.05] }, position: [0, 0.42, -1.05], material: "graphite" },
    { shape: { kind: "box", size: [0.7, 0.3, 0.4] }, position: [0, 0.15, 0.45], material: "wood" },
    { shape: { kind: "cylinder", radiusTop: 0.12, radiusBottom: 0.12, height: 0.3 }, position: [0, 0.15, 0.8], material: "fabric" },
  ],
  devlab: [
    { shape: { kind: "box", size: [0.5, 0.32, 0.4] }, position: [-0.7, 0.16, -0.3], material: "wood" },
    { shape: { kind: "box", size: [0.5, 0.32, 0.4] }, position: [0, 0.16, -0.3], material: "wood" },
    { shape: { kind: "box", size: [0.5, 0.32, 0.4] }, position: [0.7, 0.16, -0.3], material: "wood" },
    { shape: { kind: "box", size: [0.3, 0.2, 0.03] }, position: [-0.7, 0.42, -0.3], material: "glass" },
    { shape: { kind: "box", size: [0.3, 0.2, 0.03] }, position: [0, 0.42, -0.3], material: "glass" },
    { shape: { kind: "box", size: [0.3, 0.2, 0.03] }, position: [0.7, 0.42, -0.3], material: "glass" },
  ],
  lounge: [
    { shape: { kind: "box", size: [0.9, 0.3, 0.4] }, position: [-0.35, 0.15, -0.3], material: "fabric" },
    { shape: { kind: "box", size: [0.4, 0.3, 0.4] }, position: [0.55, 0.15, -0.3], material: "fabric" },
    { shape: { kind: "box", size: [0.4, 0.3, 0.4] }, position: [0.55, 0.15, 0.3], material: "fabric" },
    { shape: { kind: "cylinder", radiusTop: 0.25, radiusBottom: 0.25, height: 0.12 }, position: [-0.1, 0.06, 0.25], material: "wood" },
    { shape: { kind: "box", size: [1.2, 0.02, 1.0] }, position: [0, 0.01, 0], material: "floorCarpet" },
  ],
  rooftop: [
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 0.9 }, position: [-0.9, 0.45, -0.7], material: "wood" },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 0.9 }, position: [0.9, 0.45, -0.7], material: "wood" },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 0.9 }, position: [-0.9, 0.45, 0.7], material: "wood" },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 0.9 }, position: [0.9, 0.45, 0.7], material: "wood" },
    { shape: { kind: "box", size: [2.0, 0.05, 1.6] }, position: [0, 0.95, 0], material: "wood" },
    { shape: { kind: "box", size: [0.5, 0.2, 0.4] }, position: [-0.45, 0.1, 0.35], material: "fabric" },
    { shape: { kind: "box", size: [0.5, 0.2, 0.4] }, position: [0.45, 0.1, 0.35], material: "fabric" },
    { shape: { kind: "cylinder", radiusTop: 0.12, radiusBottom: 0.14, height: 0.22 }, position: [-0.7, 0.11, -0.5], material: "wood" },
    { shape: { kind: "sphere", radius: 0.16 }, position: [-0.7, 0.3, -0.5], material: "foliage" },
  ],
};
