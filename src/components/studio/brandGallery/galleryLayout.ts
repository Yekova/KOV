// The building.
//
// Two levels around a central void, from the three section/plan drawings:
// a square shell, a full ground floor with the lounge under the opening, a
// mezzanine ring looking down into it, brand niches let into the perimeter
// on both levels, one flight linking them, and the light installation
// hanging in the void.
//
// Authored here rather than exported from Blender, and that is still a
// decision rather than a shortcut: this is a set of rectangular volumes,
// and for rectangular volumes a GLB is a download and a loader in exchange
// for nothing. What the drawings add is the third dimension — so the model
// here grew a floor system (GALLERY_DECKS) and colliders that know their
// own height, because a room you can walk above and below is not a floor
// plan with walls on it.
//
// One list, several consumers: BrandGalleryScene draws it, collision.ts
// resolves against it, PlayerController stands on it. A wall that is drawn
// but not solid, or a floor that is drawn but not walkable, is impossible
// by construction.

/** Axis-aligned box, in metres, centred on [x, y, z]. */
export interface GalleryBox {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  material: GalleryMaterial;
  /** False for anything the visitor should pass through or stand on — a
   *  floor, a ceiling, a light cove, the mezzanine slab. Everything else
   *  stops them, but only where their body actually meets it: see
   *  resolveCollisions on why a box now has to know its own height. */
  solid?: boolean;
}

export type GalleryMaterial =
  | "concrete"
  | "stone"
  | "metal"
  | "wood"
  | "glass"
  | "warmLight"
  | "redLine";

/** A walkable surface. Flat, or a ramp climbing along one axis.
 *
 *  Height is a property of a *surface*, not of a point in plan: the same
 *  x/z is the lounge floor at zero and the mezzanine at four and a third,
 *  and which one the visitor is on depends on where they already are.
 *  floorAt resolves that. */
export interface GalleryDeck {
  id: string;
  /** [minX, minZ, maxX, maxZ] */
  rect: [number, number, number, number];
  /** Flat height, or the height at the low end of a ramp. */
  height: number;
  /** A ramp's height at the far end of `rampAxis`. */
  rampTo?: number;
  rampAxis?: "x" | "z";
}

/** Where a brand can stand. Positions in the data are authored against
 *  these; the editor in dev reads them back out. */
export interface GallerySlot {
  id: string;
  position: [number, number, number];
  rotationY: number;
  /** Which floor it belongs to, for the HUD and for proximity. */
  level: 0 | 1;
}

// ── Dimensions ─────────────────────────────────────────────────────────

/** Interior half-width. The room is 22 m square inside. */
export const HALF = 11;
/** Half-width of the opening in the mezzanine slab. */
export const VOID_HALF = 5.5;
/** Top of the mezzanine slab — the height a visitor stands at up there. */
export const LEVEL_1 = 4.3;
export const CEILING = 8.9;
export const EYE_HEIGHT = 1.68;
/** How wide the visitor is, for collision. A capsule in plan view is a
 *  circle, and a circle against boxes is the whole of the physics here. */
export const PLAYER_RADIUS = 0.34;
/** How high a lip the visitor steps over rather than walks into. Also what
 *  stops the mezzanine from being selectable as a floor while standing
 *  underneath it. */
export const STEP_UP = 0.5;

const W = 0.5; // wall thickness
const SLAB = 0.35; // mezzanine slab thickness
const MID = CEILING / 2;

/** Where the visitor starts, just inside the portal, facing into the room.
 *
 *  Yaw 0 and not PI. A camera at rotation.y = PI looks down world +Z, and
 *  the entrance is at +Z — so the old spawn had the visitor arrive facing
 *  the door they had just come through, with the whole gallery behind
 *  them. Fixed here rather than papered over with a turn animation. */
export const SPAWN: [number, number, number] = [0, EYE_HEIGHT, 9.2];
export const SPAWN_YAW = 0;

/** The portal. Standing in it offers the way out. */
export const EXIT = {
  position: [0, 0, 10.4] as [number, number, number],
  radius: 1.7,
};

/** Floor plan, in metres. North is -Z.
 *
 *      z = -11  ┌───────────────────────────────┐  brand niches, both levels
 *               │  ▯       ▣ FEATURED       ▯   │
 *               │      ┌───────────────┐        │  z = -5.5, the void edge
 *      z =  -6  │  ▯   │               │  ▯     │
 *               │      │  VIDE CENTRAL │   ▤    │  the flight, inside the void
 *      z =   0  │  ▯   │    + lounge   │   ▤    │
 *               │      │               │        │
 *      z =  +6  │  ▯   └───────────────┘  ▯     │
 *               │            ▭ PORTAIL          │
 *      z = +11  └───────────▯▯▯──────────────────┘
 *              x = -11                        x = +11
 */

// ── Shell ──────────────────────────────────────────────────────────────

const SHELL: GalleryBox[] = [
  { id: "floor", position: [0, -0.15, 0], size: [2 * HALF + W, 0.3, 2 * HALF + W], material: "stone", solid: false },
  { id: "ceiling", position: [0, CEILING, 0], size: [2 * HALF + W, 0.3, 2 * HALF + W], material: "concrete", solid: false },

  { id: "wall-n", position: [0, MID, -HALF - W / 2], size: [2 * HALF + W, CEILING, W], material: "concrete" },
  { id: "wall-w", position: [-HALF - W / 2, MID, 0], size: [W, CEILING, 2 * HALF + W], material: "concrete" },
  { id: "wall-e", position: [HALF + W / 2, MID, 0], size: [W, CEILING, 2 * HALF + W], material: "concrete" },
  // The south wall is in two pieces: the portal is the gap between them.
  { id: "wall-s-w", position: [-6.7, MID, HALF + W / 2], size: [8.6, CEILING, W], material: "concrete" },
  { id: "wall-s-e", position: [6.7, MID, HALF + W / 2], size: [8.6, CEILING, W], material: "concrete" },
];

// ── The mezzanine ──────────────────────────────────────────────────────
//
// Four bands around the opening. Not solid: the visitor walks on top of
// them and underneath them, and a collider that did both would be a
// ceiling you cannot walk beneath.

const RING_DEPTH = HALF - VOID_HALF; // 5.5
const RING_MID = (HALF + VOID_HALF) / 2;

const MEZZANINE: GalleryBox[] = [
  { id: "slab-n", position: [0, LEVEL_1 - SLAB / 2, -RING_MID], size: [2 * HALF, SLAB, RING_DEPTH], material: "stone", solid: false },
  { id: "slab-s", position: [0, LEVEL_1 - SLAB / 2, RING_MID], size: [2 * HALF, SLAB, RING_DEPTH], material: "stone", solid: false },
  { id: "slab-w", position: [-RING_MID, LEVEL_1 - SLAB / 2, 0], size: [RING_DEPTH, SLAB, 2 * VOID_HALF], material: "stone", solid: false },
  { id: "slab-e", position: [RING_MID, LEVEL_1 - SLAB / 2, 0], size: [RING_DEPTH, SLAB, 2 * VOID_HALF], material: "stone", solid: false },
];

// ── The flight ─────────────────────────────────────────────────────────
//
// In the void rather than against a wall, which is what the drawings show:
// the stair is an object you walk around on level 0 and an event in the
// volume, not a service corridor. Straight rather than the drawings'
// curve — a curve is a dozen colliders approximating an arc, and every one
// of them is a place to get caught on.

const STAIR = {
  minX: 3,
  maxX: 5.5,
  /** Top of the flight, where it meets the landing. */
  topZ: -3.5,
  /** Bottom, on the ground floor. */
  bottomZ: 4.5,
} as const;

// ── Colliders that are also architecture ───────────────────────────────

const BALUSTRADE_H = 1.1;
const BAL_Y = LEVEL_1 + BALUSTRADE_H / 2;

const GUARDS: GalleryBox[] = [
  // Around the opening. The north run stops short of the stair's landing:
  // that gap is how the visitor gets off the flight and onto the ring.
  { id: "guard-n", position: [(-VOID_HALF + STAIR.minX) / 2, BAL_Y, -VOID_HALF], size: [VOID_HALF + STAIR.minX, BALUSTRADE_H, 0.1], material: "glass" },
  { id: "guard-s", position: [0, BAL_Y, VOID_HALF], size: [2 * VOID_HALF, BALUSTRADE_H, 0.1], material: "glass" },
  { id: "guard-w", position: [-VOID_HALF, BAL_Y, 0], size: [0.1, BALUSTRADE_H, 2 * VOID_HALF], material: "glass" },
  { id: "guard-e", position: [VOID_HALF, BAL_Y, 0], size: [0.1, BALUSTRADE_H, 2 * VOID_HALF], material: "glass" },

  // The portal, closed. The floor stops a metre behind the opening, so
  // walking backwards out of the room took the visitor off the edge of the
  // world. The way out is the button the exit zone offers, not a hole.
  { id: "portal-stop", position: [0, MID, HALF + 0.1], size: [5.2, CEILING, 0.2], material: "concrete", solid: true },
];

/** The flight's open side, as a staircase of short guards climbing with
 *  it. An axis-aligned box cannot slope, so the balustrade is eight of
 *  them — each one solid only across the height its own step occupies,
 *  which is what keeps a visitor on the ground floor from being blocked by
 *  a rail four metres above their head. */
function stairGuards(): GalleryBox[] {
  const steps = 8;
  const run = STAIR.bottomZ - STAIR.topZ;
  return Array.from({ length: steps }, (_, i) => {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const z0 = STAIR.bottomZ - run * t0;
    const z1 = STAIR.bottomZ - run * t1;
    const h = LEVEL_1 * ((t0 + t1) / 2);
    return {
      id: `stair-guard-${i}`,
      position: [STAIR.minX, h + BALUSTRADE_H / 2, (z0 + z1) / 2] as [number, number, number],
      size: [0.1, BALUSTRADE_H, Math.abs(z1 - z0)] as [number, number, number],
      material: "glass" as const,
    };
  });
}

// ── The niches ─────────────────────────────────────────────────────────
//
// Generated from the slot list rather than written out sixteen times: a
// niche is two fins and a lit soffit, and the only thing that varies is
// where it is and which way it faces.

/** Every address in the building, in order: the ground floor first, which
 *  is the order a visitor meets them in. */
export const GALLERY_SLOTS: GallerySlot[] = [
  // ── Level 0. The three on the north wall face the portal across the
  //    void; the middle one is what a visitor sees on arrival.
  { id: "n0-north-w", position: [-6.5, 0, -10.4], rotationY: Math.PI, level: 0 },
  { id: "n0-north-c", position: [0, 0, -10.4], rotationY: Math.PI, level: 0 },
  { id: "n0-north-e", position: [6.5, 0, -10.4], rotationY: Math.PI, level: 0 },
  { id: "n0-west-n", position: [-10.4, 0, -6], rotationY: Math.PI / 2, level: 0 },
  { id: "n0-west-s", position: [-10.4, 0, 6], rotationY: Math.PI / 2, level: 0 },
  { id: "n0-east-n", position: [10.4, 0, -6], rotationY: -Math.PI / 2, level: 0 },
  { id: "n0-east-s", position: [10.4, 0, 6], rotationY: -Math.PI / 2, level: 0 },

  // ── Level 1. The premium ring, per the drawings.
  { id: "n1-north-w", position: [-6.5, LEVEL_1, -10.4], rotationY: Math.PI, level: 1 },
  { id: "n1-north-c", position: [0, LEVEL_1, -10.4], rotationY: Math.PI, level: 1 },
  { id: "n1-north-e", position: [6.5, LEVEL_1, -10.4], rotationY: Math.PI, level: 1 },
  { id: "n1-west-n", position: [-10.4, LEVEL_1, -6], rotationY: Math.PI / 2, level: 1 },
  { id: "n1-west-c", position: [-10.4, LEVEL_1, 0], rotationY: Math.PI / 2, level: 1 },
  { id: "n1-west-s", position: [-10.4, LEVEL_1, 6], rotationY: Math.PI / 2, level: 1 },
  { id: "n1-east-n", position: [10.4, LEVEL_1, -6], rotationY: -Math.PI / 2, level: 1 },
  { id: "n1-east-c", position: [10.4, LEVEL_1, 0], rotationY: -Math.PI / 2, level: 1 },
  { id: "n1-east-s", position: [10.4, LEVEL_1, 6], rotationY: -Math.PI / 2, level: 1 },
  { id: "n1-south-w", position: [-6.5, LEVEL_1, 10.4], rotationY: 0, level: 1 },
  { id: "n1-south-e", position: [6.5, LEVEL_1, 10.4], rotationY: 0, level: 1 },
];

const NICHE_HALF_WIDTH = 1.9;
const FIN = { width: 0.42, depth: 1.1, height: 3.3 };

/** Two fins and a soffit per address. The fins are solid — they are what
 *  makes an address a room rather than a rectangle painted on a wall — and
 *  they only occupy the height of their own level, so the ones upstairs
 *  are not invisible walls on the ground floor. */
function nicheArchitecture(): { boxes: GalleryBox[]; soffits: GalleryBox[] } {
  const boxes: GalleryBox[] = [];
  const soffits: GalleryBox[] = [];

  for (const slot of GALLERY_SLOTS) {
    const [x, y, z] = slot.position;
    // Which way "along the wall" and "into the room" point for this slot.
    const along: [number, number] = Math.abs(Math.sin(slot.rotationY)) > 0.5 ? [0, 1] : [1, 0];
    const into: [number, number] = [Math.sin(slot.rotationY), Math.cos(slot.rotationY)];

    for (const side of [-1, 1]) {
      boxes.push({
        id: `${slot.id}-fin-${side}`,
        position: [
          x + along[0] * side * NICHE_HALF_WIDTH + into[0] * (FIN.depth / 2),
          y + FIN.height / 2,
          z + along[1] * side * NICHE_HALF_WIDTH + into[1] * (FIN.depth / 2),
        ],
        size: [
          along[0] ? FIN.width : FIN.depth,
          FIN.height,
          along[1] ? FIN.width : FIN.depth,
        ],
        material: "stone",
      });
    }

    soffits.push({
      id: `${slot.id}-soffit`,
      position: [x + into[0] * 0.5, y + FIN.height - 0.06, z + into[1] * 0.5],
      size: [along[0] ? 2 * NICHE_HALF_WIDTH - 0.5 : 0.09, 0.06, along[1] ? 2 * NICHE_HALF_WIDTH - 0.5 : 0.09],
      material: "warmLight",
      solid: false,
    });
  }

  return { boxes, soffits };
}

const NICHES = nicheArchitecture();

// ── The lounge, under the opening ──────────────────────────────────────
//
// Three seats and a table, in the west half of the void.
//
// Walked before it was placed, which is how it moved: centred on the axis
// it blocked the walk from the portal to the far wall at four metres in,
// and its east seat sealed the approach to the foot of the flight. The
// room has two things that must never be furniture: the line from the door
// to the niche opposite it, and the way to the stair.

const LOUNGE: GalleryBox[] = [
  { id: "seat-w", position: [-4.5, 0.22, 1.6], size: [0.9, 0.44, 3.2], material: "wood" },
  { id: "seat-e", position: [-0.7, 0.22, 1.6], size: [0.9, 0.44, 3.2], material: "wood" },
  { id: "seat-n", position: [-2.6, 0.22, -0.3], size: [3.8, 0.44, 0.9], material: "wood" },
  { id: "table", position: [-2.6, 0.2, 1.8], size: [1.4, 0.4, 1.4], material: "metal" },

  // The reception desk, beside the portal.
  { id: "desk", position: [-4.6, 0.52, 7.6], size: [3, 1.04, 0.8], material: "stone" },
];

// ── Everything drawn ───────────────────────────────────────────────────

export const GALLERY_BOXES: GalleryBox[] = [
  ...SHELL,
  ...MEZZANINE,
  ...GUARDS,
  ...stairGuards(),
  ...NICHES.boxes,
  ...LOUNGE,
];

/** Light coves and the one red line, drawn as emissive strips. Never
 *  solid, never a light source — see BrandGalleryScene on why this room is
 *  lit by fixed sources and a lot of emissive geometry. */
export const GALLERY_COVES: GalleryBox[] = [
  ...NICHES.soffits,
  // The perimeter cove that washes the top of each level's wall.
  { id: "cove-n0", position: [0, 3.9, -HALF + 0.12], size: [2 * HALF - 1, 0.07, 0.07], material: "warmLight", solid: false },
  { id: "cove-n1", position: [0, CEILING - 0.4, -HALF + 0.12], size: [2 * HALF - 1, 0.07, 0.07], material: "warmLight", solid: false },
  { id: "cove-w0", position: [-HALF + 0.12, 3.9, 0], size: [0.07, 0.07, 2 * HALF - 1], material: "warmLight", solid: false },
  { id: "cove-w1", position: [-HALF + 0.12, CEILING - 0.4, 0], size: [0.07, 0.07, 2 * HALF - 1], material: "warmLight", solid: false },
  { id: "cove-e0", position: [HALF - 0.12, 3.9, 0], size: [0.07, 0.07, 2 * HALF - 1], material: "warmLight", solid: false },
  { id: "cove-e1", position: [HALF - 0.12, CEILING - 0.4, 0], size: [0.07, 0.07, 2 * HALF - 1], material: "warmLight", solid: false },
  // The mezzanine's own edge, lit from under the slab.
  { id: "cove-void-n", position: [0, LEVEL_1 - SLAB - 0.05, -VOID_HALF], size: [2 * VOID_HALF, 0.05, 0.05], material: "warmLight", solid: false },
  { id: "cove-void-s", position: [0, LEVEL_1 - SLAB - 0.05, VOID_HALF], size: [2 * VOID_HALF, 0.05, 0.05], material: "warmLight", solid: false },
  { id: "cove-void-w", position: [-VOID_HALF, LEVEL_1 - SLAB - 0.05, 0], size: [0.05, 0.05, 2 * VOID_HALF], material: "warmLight", solid: false },
  { id: "cove-void-e", position: [VOID_HALF, LEVEL_1 - SLAB - 0.05, 0], size: [0.05, 0.05, 2 * VOID_HALF], material: "warmLight", solid: false },
  // KOV's accent as a signal, not as decoration: one line in the floor,
  // from the portal to the wall the visitor is walking toward.
  { id: "axis", position: [0, 0.012, 0], size: [0.05, 0.02, 2 * HALF], material: "redLine", solid: false },
];

// ── The floor system ───────────────────────────────────────────────────

export const GALLERY_DECKS: GalleryDeck[] = [
  { id: "level-0", rect: [-HALF, -HALF, HALF, HALF], height: 0 },

  { id: "ring-n", rect: [-HALF, -HALF, HALF, -VOID_HALF], height: LEVEL_1 },
  { id: "ring-s", rect: [-HALF, VOID_HALF, HALF, HALF], height: LEVEL_1 },
  { id: "ring-w", rect: [-HALF, -VOID_HALF, -VOID_HALF, VOID_HALF], height: LEVEL_1 },
  { id: "ring-e", rect: [VOID_HALF, -VOID_HALF, HALF, VOID_HALF], height: LEVEL_1 },

  // The flight climbs northward: level 1 at its low-z end, the ground
  // floor at its high-z end.
  {
    id: "stair",
    rect: [STAIR.minX, STAIR.topZ, STAIR.maxX, STAIR.bottomZ],
    height: LEVEL_1,
    rampTo: 0,
    rampAxis: "z",
  },
  // The landing, between the top of the flight and the ring.
  { id: "stair-landing", rect: [STAIR.minX, -VOID_HALF, STAIR.maxX, STAIR.topZ], height: LEVEL_1 },
];

/** The height of one deck at a point inside it. */
function deckHeight(deck: GalleryDeck, x: number, z: number) {
  if (deck.rampTo === undefined || !deck.rampAxis) return deck.height;
  const [minX, minZ, maxX, maxZ] = deck.rect;
  const t =
    deck.rampAxis === "z"
      ? (z - minZ) / Math.max(1e-6, maxZ - minZ)
      : (x - minX) / Math.max(1e-6, maxX - minX);
  return deck.height + (deck.rampTo - deck.height) * Math.min(1, Math.max(0, t));
}

/** What the visitor is standing on at this point, given where they already
 *  are.
 *
 *  The highest surface they could be on — anything more than a step above
 *  their feet is a thing they are under, not a thing they are on. That one
 *  rule is what lets the same x/z be the lounge from below and the
 *  mezzanine from above without either level knowing about the other.
 *
 *  Null outside the building, which cannot happen while the walls hold but
 *  is worth being explicit about. */
export function floorAt(x: number, z: number, fromY: number): number | null {
  let best: number | null = null;
  for (const deck of GALLERY_DECKS) {
    const [minX, minZ, maxX, maxZ] = deck.rect;
    if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
    const height = deckHeight(deck, x, z);
    if (height > fromY + STEP_UP) continue;
    if (best === null || height > best) best = height;
  }
  return best;
}

/** Which floor a height belongs to, for the HUD. */
export const levelAt = (y: number): 0 | 1 => (y > LEVEL_1 / 2 ? 1 : 0);

/** Everything a body can hit. Derived from the same list that is drawn, so
 *  a wall cannot be solid on screen and passable in fact. */
export const GALLERY_COLLIDERS = GALLERY_BOXES.filter((box) => box.solid !== false);
