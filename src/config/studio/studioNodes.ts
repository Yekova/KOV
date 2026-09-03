// Generic multi-panorama data model — even though only P01 exists in this
// V1, nothing here is P01-specific logic; adding P02 later is purely a
// matter of adding another entry to STUDIO_NODES (see the README section
// of the engine's own docs for the exact steps). Angles in radians.

export interface StudioConnection {
  /** id of the StudioNode this connection leads to. */
  targetNodeId: string;
  /** 3D position (world space, on/near the inside of the panorama sphere)
   * the hotspot is anchored to — never a 2D screen percentage. */
  position: [number, number, number];
  label: string;
}

export interface StudioNode {
  id: string;
  name: string;
  /** Short room code shown in the HUD ("P01"). */
  room: string;
  /** Path under /public to this node's equirectangular panorama texture. */
  panorama: string;
  /** Camera orientation on arrival — tuned per-node so the visitor lands
   * facing the room's main passage, not a wall or the panorama's seam. */
  initialYaw: number;
  initialPitch: number;
  connections: StudioConnection[];
}

export const STUDIO_CAMERA_HEIGHT_M = 1.65;

export const STUDIO_ENTRY_NODE_ID = "p01";

export const STUDIO_NODES: Record<string, StudioNode> = {
  p01: {
    id: "p01",
    name: "Portal",
    room: "P01",
    panorama: "/studio/panoramas/p01.webp",
    // The texture's horizontal center already frames the lit passage/arch
    // — the natural "face forward" direction — so yaw 0 needs no offset.
    // The panorama's seam (±180° longitude) falls at the texture's left/
    // right edges, i.e. directly behind this orientation, well away from
    // the passage that draws the eye on arrival.
    initialYaw: 0,
    initialPitch: 0,
    connections: [
      {
        targetNodeId: "p02",
        // Placeholder — needs visual tuning once P02 is real (see
        // StudioDebugPanel for a live yaw/pitch/fov readout to help place
        // it precisely). Currently aimed at the lit passage straight
        // ahead, slightly below eye level.
        position: [0, -30, -480],
        label: "Design Studio",
      },
    ],
  },
};
