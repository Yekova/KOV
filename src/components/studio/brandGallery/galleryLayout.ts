// The building.
//
// Authored here rather than exported from Blender, and that is a decision
// rather than a shortcut: this room is a set of rectangular volumes — walls,
// piers, plinths, a bench — and for rectangular volumes a GLB is a download
// and a loader in exchange for nothing. The brief's GLB workflow is the
// right answer the day the architecture stops being boxes; until then every
// wall is one line here and the collider list is generated from the same
// line, so the thing you see and the thing you hit can never disagree.
//
// One list, two consumers: BrandGalleryScene draws it, CollisionLayer
// resolves against it. A wall that is drawn but not solid is impossible by
// construction.

/** Axis-aligned box, in metres, centred on [x, y, z]. */
export interface GalleryBox {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  material: GalleryMaterial;
  /** False for anything the visitor should walk through or over — a floor,
   *  a ceiling, a light cove. Everything else stops them. */
  solid?: boolean;
}

export type GalleryMaterial =
  | "concrete"
  | "graphite"
  | "blackStone"
  | "darkWood"
  | "smokedGlass"
  | "warmLight"
  | "redLine";

/** Where a brand can stand. Positions in the data are authored against
 *  these; the editor in dev reads them back out. */
export interface GallerySlot {
  id: string;
  position: [number, number, number];
  rotationY: number;
}

export const GALLERY_HEIGHT = 4.6;
export const EYE_HEIGHT = 1.7;
/** How wide the visitor is, for collision. A capsule in plan view is a
 *  circle, and a circle against boxes is the whole of the physics here. */
export const PLAYER_RADIUS = 0.34;

/** Where the visitor starts, just inside the entrance, facing down the
 *  axis into the room. Deliberately clear of the exit zone below: at the
 *  old spawn the visitor arrived already standing in the doorway, so the
 *  first thing the room offered them was the way out of it. */
export const SPAWN: [number, number, number] = [0, EYE_HEIGHT, 1];
export const SPAWN_YAW = Math.PI;

/** The doorway back to the Portal. Standing in it offers the way out. */
export const EXIT = {
  position: [0, 0, 3.7] as [number, number, number],
  radius: 1.6,
};

const W = 0.4; // wall thickness
const HALF = GALLERY_HEIGHT / 2;

/** Floor plan, in metres:
 *
 *      z = -17  ┌───────────────────────┐   back wall, the featured recess
 *               │      ▭ FEATURED       │
 *               │   ▯             ▯     │   side alcoves
 *      z = -10  │                       │
 *               │  ▮  central volumes ▮ │
 *      z =  -4  │   ▯             ▯     │
 *               │                       │
 *      z =  +4  └────────── ▯ ──────────┘   entrance, exit doorway
 *              x = -9                x = +9
 */
export const GALLERY_BOXES: GalleryBox[] = [
  // ── Shell ─────────────────────────────────────────────────────────────
  { id: "floor", position: [0, -0.05, -6.5], size: [18.4, 0.1, 21.4], material: "blackStone", solid: false },
  { id: "ceiling", position: [0, GALLERY_HEIGHT, -6.5], size: [18.4, 0.1, 21.4], material: "concrete", solid: false },
  { id: "wall-north", position: [0, HALF, -17.2], size: [18.4, GALLERY_HEIGHT, W], material: "concrete" },
  { id: "wall-south-l", position: [-5.7, HALF, 4.2], size: [7, GALLERY_HEIGHT, W], material: "concrete" },
  { id: "wall-south-r", position: [5.7, HALF, 4.2], size: [7, GALLERY_HEIGHT, W], material: "concrete" },
  { id: "wall-west", position: [-9, HALF, -6.5], size: [W, GALLERY_HEIGHT, 21.4], material: "concrete" },
  { id: "wall-east", position: [9, HALF, -6.5], size: [W, GALLERY_HEIGHT, 21.4], material: "concrete" },

  // ── Piers, which make the axis read as a gallery rather than a hall ──
  { id: "pier-w-1", position: [-5.4, HALF, -2], size: [0.7, GALLERY_HEIGHT, 0.7], material: "concrete" },
  { id: "pier-w-2", position: [-5.4, HALF, -8], size: [0.7, GALLERY_HEIGHT, 0.7], material: "concrete" },
  { id: "pier-w-3", position: [-5.4, HALF, -14], size: [0.7, GALLERY_HEIGHT, 0.7], material: "concrete" },
  { id: "pier-e-1", position: [5.4, HALF, -2], size: [0.7, GALLERY_HEIGHT, 0.7], material: "concrete" },
  { id: "pier-e-2", position: [5.4, HALF, -8], size: [0.7, GALLERY_HEIGHT, 0.7], material: "concrete" },
  { id: "pier-e-3", position: [5.4, HALF, -14], size: [0.7, GALLERY_HEIGHT, 0.7], material: "concrete" },

  // ── Alcove dividers, west and east ───────────────────────────────────
  { id: "div-w-1", position: [-7.6, HALF, -5], size: [2.6, GALLERY_HEIGHT, 0.3], material: "graphite" },
  { id: "div-w-2", position: [-7.6, HALF, -11], size: [2.6, GALLERY_HEIGHT, 0.3], material: "graphite" },
  { id: "div-e-1", position: [7.6, HALF, -5], size: [2.6, GALLERY_HEIGHT, 0.3], material: "graphite" },
  { id: "div-e-2", position: [7.6, HALF, -11], size: [2.6, GALLERY_HEIGHT, 0.3], material: "graphite" },

  // ── Two central volumes, walked around ───────────────────────────────
  { id: "volume-1", position: [-1.8, 1.4, -7], size: [2.2, 2.8, 2.2], material: "blackStone" },
  { id: "volume-2", position: [1.8, 1.1, -11.4], size: [2.2, 2.2, 2.2], material: "darkWood" },

  // ── The bench on the axis, the one place to stop ─────────────────────
  { id: "bench", position: [0, 0.22, -3.6], size: [2.4, 0.44, 0.6], material: "darkWood" },
];

/** Light coves. Drawn as emissive strips, never solid, never a light
 *  source — see BrandGalleryScene on why this room is lit by three fixed
 *  lights and a lot of emissive geometry rather than by one light per
 *  fixture. */
export const GALLERY_COVES: GalleryBox[] = [
  { id: "cove-w", position: [-8.6, GALLERY_HEIGHT - 0.35, -6.5], size: [0.06, 0.06, 20], material: "warmLight", solid: false },
  { id: "cove-e", position: [8.6, GALLERY_HEIGHT - 0.35, -6.5], size: [0.06, 0.06, 20], material: "warmLight", solid: false },
  { id: "cove-n", position: [0, GALLERY_HEIGHT - 0.35, -16.9], size: [17.4, 0.06, 0.06], material: "warmLight", solid: false },
  // The one red line in the room, set into the floor on the axis. KOV's
  // accent as a signal, not as decoration.
  { id: "axis", position: [0, 0.012, -7], size: [0.05, 0.02, 18], material: "redLine", solid: false },
];

/** The room's addresses. Eight, which is what the architecture holds
 *  without crowding: four alcoves, two piers' faces, the far recess, and
 *  the volume opposite it. */
export const GALLERY_SLOTS: GallerySlot[] = [
  { id: "alcove-w-1", position: [-7.4, 0, -2.4], rotationY: Math.PI / 2 },
  { id: "alcove-w-2", position: [-7.4, 0, -8], rotationY: Math.PI / 2 },
  { id: "alcove-w-3", position: [-7.4, 0, -13.6], rotationY: Math.PI / 2 },
  { id: "alcove-e-1", position: [7.4, 0, -2.4], rotationY: -Math.PI / 2 },
  { id: "alcove-e-2", position: [7.4, 0, -8], rotationY: -Math.PI / 2 },
  { id: "alcove-e-3", position: [7.4, 0, -13.6], rotationY: -Math.PI / 2 },
  { id: "axis-1", position: [-2.6, 0, -12.4], rotationY: Math.PI / 4 },
  { id: "featured", position: [0, 0, -16.2], rotationY: 0 },
];

/** Colliders with nothing to draw.
 *
 *  The south wall has a four-metre gap in it — the doorway — and the
 *  floor stops a hundred and fifty centimetres behind it. Walking
 *  backwards out of the room therefore took the visitor off the edge of
 *  the world, into a black void with no way back but the browser's back
 *  button. The doorway stays open to look at; this closes it to walk
 *  through. The way out is the button the exit zone offers, not a hole. */
const GALLERY_BARRIERS: GalleryBox[] = [
  { id: "doorway-stop", position: [0, HALF, 4.3], size: [4.8, GALLERY_HEIGHT, 0.3], material: "concrete" },
];

/** Everything a body can hit. Derived from the same list that is drawn,
 *  so a wall cannot be solid on screen and passable in fact — plus the
 *  barriers above, which are the one deliberate exception. */
export const GALLERY_COLLIDERS = [...GALLERY_BOXES.filter((box) => box.solid !== false), ...GALLERY_BARRIERS];
