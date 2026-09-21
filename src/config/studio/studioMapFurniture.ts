import type { StudioMapMaterialKey } from "@/config/studio/studioMapMaterials";

export type FurnitureShape =
  | { kind: "box"; size: [number, number, number] }
  | { kind: "cylinder"; radiusTop: number; radiusBottom: number; height: number }
  | { kind: "sphere"; radius: number };

export interface FurnitureItem {
  shape: FurnitureShape;
  /** Local offset from the room's own centre — not a world position. */
  position: [number, number, number];
  material: StudioMapMaterialKey;
  rotationY?: number;
  /** Included in the mini HUD map's reduced LOD. Roughly the 3-5 pieces
   * per room that still read at 220px tall; everything else is
   * expanded-only. */
  mini?: boolean;
}

export type StudioRoomType = "portal" | "design" | "sport" | "motion" | "bureau" | "lounge" | "rooftop";

// --- small composition helpers -------------------------------------------
// Furniture is built from a handful of primitives rather than one box per
// object — a chair is a seat + a back, a desk is a top + leg panels. That
// composition is what reads as furniture at this scale; polygon count
// stays trivial either way.

function chair(x: number, z: number, rotationY = 0, material: StudioMapMaterialKey = "fabricDark"): FurnitureItem[] {
  const bx = x - Math.sin(rotationY) * 0.15;
  const bz = z - Math.cos(rotationY) * 0.15;
  return [
    { shape: { kind: "box", size: [0.34, 0.07, 0.34] }, position: [x, 0.26, z], material, rotationY },
    { shape: { kind: "cylinder", radiusTop: 0.04, radiusBottom: 0.06, height: 0.22 }, position: [x, 0.11, z], material: "graphite" },
    { shape: { kind: "box", size: [0.34, 0.34, 0.06] }, position: [bx, 0.46, bz], material, rotationY },
  ];
}

function desk(
  x: number,
  z: number,
  width: number,
  depth: number,
  material: StudioMapMaterialKey = "darkWood",
  mini = false
): FurnitureItem[] {
  return [
    { shape: { kind: "box", size: [width, 0.05, depth] }, position: [x, 0.4, z], material, mini },
    { shape: { kind: "box", size: [0.06, 0.38, depth * 0.8] }, position: [x - width / 2 + 0.1, 0.19, z], material: "graphite" },
    { shape: { kind: "box", size: [0.06, 0.38, depth * 0.8] }, position: [x + width / 2 - 0.1, 0.19, z], material: "graphite" },
  ];
}

function plant(x: number, z: number, y = 0, scale = 1, mini = false): FurnitureItem[] {
  return [
    {
      shape: { kind: "cylinder", radiusTop: 0.15 * scale, radiusBottom: 0.18 * scale, height: 0.34 * scale },
      position: [x, y + 0.17 * scale, z],
      material: "planter",
      mini,
    },
    { shape: { kind: "sphere", radius: 0.26 * scale }, position: [x, y + 0.52 * scale, z], material: "foliage", mini },
    { shape: { kind: "sphere", radius: 0.17 * scale }, position: [x + 0.14 * scale, y + 0.72 * scale, z - 0.08 * scale], material: "foliage" },
  ];
}

function monitor(x: number, y: number, z: number, width = 0.42, rotationY = 0): FurnitureItem {
  return { shape: { kind: "box", size: [width, 0.27, 0.03] }, position: [x, y, z], material: "screen", rotationY };
}

// Keyed by room *type*, not by room id — StudioMapRoom.tsx looks this up
// generically, so nothing in the render code branches on a literal id.
export const STUDIO_MAP_FURNITURE: Record<StudioRoomType, FurnitureItem[]> = {
  // P01 — lobby: reception desk facing the glazed entrance, KOV wall
  // behind it, a small waiting corner.
  portal: [
    { shape: { kind: "box", size: [1.6, 0.08, 0.52] }, position: [-1.05, 0.44, -0.35], material: "darkWood", mini: true },
    { shape: { kind: "box", size: [1.6, 0.42, 0.12] }, position: [-1.05, 0.21, -0.12], material: "graphite", mini: true },
    { shape: { kind: "box", size: [1.3, 0.34, 0.04] }, position: [-1.05, 0.78, -1.18], material: "kovRed", mini: true },
    { shape: { kind: "box", size: [0.5, 0.1, 1.2] }, position: [1.55, 0.3, 0.1], material: "fabricLight" },
    { shape: { kind: "box", size: [0.44, 0.24, 1.1] }, position: [1.55, 0.13, 0.1], material: "graphite" },
    { shape: { kind: "cylinder", radiusTop: 0.24, radiusBottom: 0.24, height: 0.05 }, position: [0.85, 0.34, 0.45], material: "darkWood" },
    { shape: { kind: "cylinder", radiusTop: 0.06, radiusBottom: 0.09, height: 0.3 }, position: [0.85, 0.16, 0.45], material: "warmMetal" },
    ...plant(1.75, -0.95, 0, 1, true),
    { shape: { kind: "box", size: [1.5, 0.02, 0.8] }, position: [0, 0.02, 0.85], material: "fabricDark" },
  ],

  // P02 — one big table, wall display, shelving. Deliberately the most
  // open room in the plan.
  design: [
    ...desk(0, -0.1, 2, 0.9, "darkWood", true),
    ...chair(-0.5, 0.62),
    ...chair(0.4, 0.62),
    ...chair(-0.5, -0.82, Math.PI),
    ...chair(0.4, -0.82, Math.PI),
    monitor(-0.55, 0.57, -0.1),
    monitor(0.5, 0.57, -0.1),
    { shape: { kind: "box", size: [1.7, 0.6, 0.05] }, position: [0, 0.8, -1.38], material: "screen", mini: true },
    { shape: { kind: "box", size: [0.3, 0.9, 1.2] }, position: [-1.6, 0.45, 0.75], material: "graphite", mini: true },
    { shape: { kind: "box", size: [0.26, 0.03, 1.12] }, position: [-1.58, 0.36, 0.75], material: "darkWood" },
    { shape: { kind: "box", size: [0.26, 0.03, 1.12] }, position: [-1.58, 0.66, 0.75], material: "darkWood" },
    ...plant(1.5, 1.15),
  ],

  // P03 — rebuilt from the room's own panorama rather than inherited from
  // the "Galerie Projets" placeholder this slot used to be. That version
  // was wall panels and picture lights; the photograph is a treadmill and a
  // bike by the west windows, a rack of weights, a bench in the middle and
  // mats along the east side. The mini-map claims to be the floor plan, so
  // it has to show the room that is actually there.
  sport: [
    // Treadmill and bike along the west glazing.
    { shape: { kind: "box", size: [0.42, 0.14, 0.9] }, position: [-1.0, 0.09, -0.75], material: "graphite", mini: true },
    { shape: { kind: "box", size: [0.4, 0.5, 0.06] }, position: [-1.0, 0.4, -1.15], material: "graphite" },
    { shape: { kind: "box", size: [0.3, 0.1, 0.62] }, position: [-1.0, 0.1, 0.45], material: "graphite", mini: true },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 0.55 }, position: [-1.0, 0.38, 0.22], material: "graphite" },
    // Bench in the middle, with the weights beside it.
    { shape: { kind: "box", size: [0.26, 0.09, 0.85] }, position: [0.05, 0.38, 0.1], material: "fabricDark", mini: true },
    { shape: { kind: "box", size: [0.1, 0.34, 0.1] }, position: [0.05, 0.17, -0.25], material: "graphite" },
    { shape: { kind: "box", size: [0.1, 0.34, 0.1] }, position: [0.05, 0.17, 0.45], material: "graphite" },
    { shape: { kind: "cylinder", radiusTop: 0.12, radiusBottom: 0.12, height: 0.24 }, position: [0.6, 0.12, 0.2], material: "blackStone" },
    // Rack against the north wall.
    { shape: { kind: "box", size: [1.1, 0.5, 0.26] }, position: [0.1, 0.25, -1.4], material: "graphite", mini: true },
    { shape: { kind: "box", size: [1.0, 0.03, 0.03] }, position: [0.1, 0.44, -1.3], material: "warmEmissive" },
    // Mats along the east side.
    { shape: { kind: "box", size: [0.5, 0.03, 1.0] }, position: [1.0, 0.02, 0.35], material: "fabricDark", mini: true },
    { shape: { kind: "box", size: [0.5, 0.03, 1.0] }, position: [1.0, 0.02, -0.85], material: "fabricDark" },
    ...plant(-1.15, 1.3, 0, 0.85),
  ],

  // P04 — projection room: big screen, one workstation, soft seating,
  // indirect light behind the screen.
  motion: [
    { shape: { kind: "box", size: [1.9, 0.95, 0.06] }, position: [0, 0.58, -1.38], material: "screen", mini: true },
    { shape: { kind: "box", size: [1.9, 0.05, 0.05] }, position: [0, 1.1, -1.32], material: "coolEmissive" },
    ...desk(0, 0.25, 1.1, 0.5, "graphite", true),
    ...chair(0, 0.8, Math.PI),
    { shape: { kind: "box", size: [0.45, 0.3, 0.45] }, position: [-0.72, 0.15, 1.12], material: "fabricDark" },
    { shape: { kind: "box", size: [0.45, 0.3, 0.45] }, position: [0.72, 0.15, 1.12], material: "fabricDark" },
  ],

  // P05 — two workbenches facing each other, monitors, a small rack.
  // Rebuilt from the room's own panorama rather than inherited from the
  // "Dev Lab" placeholder this slot used to be. That version was two
  // benches, four monitors and a server rack; the photograph is a single
  // sculpted desk facing a bay window, two armchairs in front of it, a
  // linear fireplace and a wall of shelving. The mini-map claims to be the
  // floor plan, so it has to show the room that is actually there.
  bureau: [
    // The desk runs along the east wall, facing the bay window.
    ...desk(0.45, 0, 0.55, 1.5, "warmMetal", true),
    ...chair(0.84, 0, -Math.PI / 2),
    // The two seats across it.
    ...chair(-0.05, -0.36, Math.PI / 2),
    ...chair(-0.05, 0.36, Math.PI / 2),
    // Linear fireplace, north wall.
    { shape: { kind: "box", size: [0.95, 0.32, 0.14] }, position: [-0.25, 0.16, -1.36], material: "blackStone", mini: true },
    { shape: { kind: "box", size: [0.62, 0.03, 0.03] }, position: [-0.25, 0.25, -1.3], material: "warmEmissive" },
    // Shelving, south wall.
    { shape: { kind: "box", size: [1.5, 0.86, 0.2] }, position: [0.05, 0.43, 1.38], material: "darkWood", mini: true },
    { shape: { kind: "box", size: [1.3, 0.02, 0.02] }, position: [0.05, 0.6, 1.27], material: "warmEmissive" },
    // The reading corner opposite the fireplace.
    { shape: { kind: "box", size: [0.56, 0.3, 0.56] }, position: [-0.82, 0.16, -0.7], material: "fabricLight" },
    { shape: { kind: "box", size: [0.56, 0.16, 0.16] }, position: [-0.82, 0.38, -0.92], material: "fabricLight" },
    ...plant(-0.88, 0.75, 0, 0.9),
  ],

  // P06 — the warm room: modular sofa, armchairs, rug, linear fireplace.
  lounge: [
    { shape: { kind: "box", size: [2, 0.02, 1.6] }, position: [0, 0.02, 0.15], material: "fabricDark", mini: true },
    { shape: { kind: "box", size: [1.6, 0.3, 0.7] }, position: [0, 0.16, -0.75], material: "fabricLight", mini: true },
    { shape: { kind: "box", size: [1.6, 0.36, 0.16] }, position: [0, 0.43, -1.02], material: "fabricLight" },
    { shape: { kind: "box", size: [0.16, 0.4, 0.7] }, position: [-0.72, 0.2, -0.75], material: "fabricLight" },
    { shape: { kind: "box", size: [0.16, 0.4, 0.7] }, position: [0.72, 0.2, -0.75], material: "fabricLight" },
    { shape: { kind: "box", size: [0.58, 0.3, 0.58] }, position: [-0.82, 0.16, 0.9], material: "fabricLight" },
    { shape: { kind: "box", size: [0.58, 0.16, 0.16] }, position: [-0.82, 0.38, 1.12], material: "fabricLight" },
    { shape: { kind: "box", size: [0.58, 0.3, 0.58] }, position: [0.82, 0.16, 0.9], material: "fabricLight" },
    { shape: { kind: "box", size: [0.58, 0.16, 0.16] }, position: [0.82, 0.38, 1.12], material: "fabricLight" },
    { shape: { kind: "box", size: [0.85, 0.06, 0.5] }, position: [0, 0.33, 0.15], material: "darkWood", mini: true },
    { shape: { kind: "box", size: [0.32, 0.3, 0.3] }, position: [0, 0.16, 0.15], material: "warmMetal" },
    { shape: { kind: "box", size: [1.2, 0.2, 0.08] }, position: [0, 0.5, 1.5], material: "blackStone" },
    { shape: { kind: "box", size: [1, 0.07, 0.04] }, position: [0, 0.5, 1.45], material: "warmEmissive", mini: true },
    { shape: { kind: "box", size: [0.28, 0.85, 1] }, position: [-1.25, 0.42, -0.45], material: "graphite" },
    ...plant(1.12, -1.25),
  ],

  // P07 — terrace: pergola over an outdoor lounge, planters, deck lights.
  // The parapet is generated by the architecture layer, not here.
  rooftop: [
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 1 }, position: [-1.55, 0.5, -1.05], material: "warmMetal", mini: true },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 1 }, position: [1.05, 0.5, -1.05], material: "warmMetal", mini: true },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 1 }, position: [-1.55, 0.5, 1.05], material: "warmMetal", mini: true },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 1 }, position: [1.05, 0.5, 1.05], material: "warmMetal", mini: true },
    { shape: { kind: "box", size: [2.75, 0.07, 0.09] }, position: [-0.25, 1.02, -1.05], material: "darkWood", mini: true },
    { shape: { kind: "box", size: [2.75, 0.07, 0.09] }, position: [-0.25, 1.02, 1.05], material: "darkWood", mini: true },
    { shape: { kind: "box", size: [0.09, 0.07, 2.2] }, position: [-1.55, 1.02, 0], material: "darkWood" },
    { shape: { kind: "box", size: [0.09, 0.07, 2.2] }, position: [1.05, 1.02, 0], material: "darkWood" },
    { shape: { kind: "box", size: [2.6, 0.03, 0.05] }, position: [-0.25, 1.06, -0.6], material: "darkWood" },
    { shape: { kind: "box", size: [2.6, 0.03, 0.05] }, position: [-0.25, 1.06, -0.2], material: "darkWood" },
    { shape: { kind: "box", size: [2.6, 0.03, 0.05] }, position: [-0.25, 1.06, 0.2], material: "darkWood" },
    { shape: { kind: "box", size: [2.6, 0.03, 0.05] }, position: [-0.25, 1.06, 0.6], material: "darkWood" },
    { shape: { kind: "box", size: [1.7, 0.28, 0.62] }, position: [-0.55, 0.15, 0.62], material: "fabricLight", mini: true },
    { shape: { kind: "box", size: [1.7, 0.3, 0.14] }, position: [-0.55, 0.42, 0.87], material: "fabricLight" },
    { shape: { kind: "box", size: [0.8, 0.05, 0.5] }, position: [-0.55, 0.32, -0.2], material: "darkWood" },
    { shape: { kind: "box", size: [0.22, 0.3, 0.22] }, position: [-0.55, 0.15, -0.2], material: "warmMetal" },
    { shape: { kind: "box", size: [0.5, 0.26, 0.5] }, position: [1.65, 0.13, 0.75], material: "fabricDark" },
    { shape: { kind: "box", size: [0.44, 0.34, 0.44] }, position: [1.9, 0.17, -1.35], material: "planter", mini: true },
    { shape: { kind: "sphere", radius: 0.3 }, position: [1.9, 0.5, -1.35], material: "foliage", mini: true },
    { shape: { kind: "box", size: [0.44, 0.34, 0.44] }, position: [-2, 0.17, -1.35], material: "planter" },
    { shape: { kind: "sphere", radius: 0.28 }, position: [-2, 0.48, -1.35], material: "foliage" },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 0.08 }, position: [-2, 0.05, 1.6], material: "warmEmissive" },
    { shape: { kind: "cylinder", radiusTop: 0.05, radiusBottom: 0.05, height: 0.08 }, position: [1.9, 0.05, 1.6], material: "warmEmissive" },
  ],
};

// Short French label + the "what's in this room" bullets for the expanded
// map's info panel — describing the schematic furniture above, not
// fabricated facts about the business.
export const STUDIO_ROOM_TYPE_INFO: Record<StudioRoomType, { label: string; features: string[] }> = {
  portal: {
    label: "Réception",
    features: ["Desk d'accueil", "Mur KOV", "Façade vitrée", "Coin d'attente", "Plante d'intérieur"],
  },
  design: {
    label: "Studio de design",
    features: ["Grande table centrale", "Wall display", "Postes de travail", "Étagère", "Ouverture vitrée"],
  },
  sport: {
    label: "Salle de sport",
    features: ["Panneaux d'exposition", "Éclairage sur cadres", "Banc central", "Circulation traversante"],
  },
  motion: {
    label: "Salle motion",
    features: ["Grand écran", "Éclairage indirect", "Poste de travail", "Assises basses"],
  },
  bureau: {
    label: "Bureau",
    features: ["Plan de travail sculpté", "Baie panoramique", "Cheminée linéaire", "Coin lecture", "Bibliothèque"],
  },
  lounge: {
    label: "Lounge",
    features: ["Canapé modulaire", "Fauteuils", "Table basse", "Tapis", "Cheminée linéaire"],
  },
  rooftop: {
    label: "Terrasse",
    features: ["Pergola", "Assises extérieures", "Garde-corps", "Végétation", "Éclairage de sol"],
  },
};
