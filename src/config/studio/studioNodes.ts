// Generic multi-panorama data model — proven out by P02, which added a
// real second node without changing anything here beyond a new STUDIO_NODES
// entry (the engine, hotspot layers, and navigation logic were already
// generic). Angles in radians.

import { PROJECTS } from "@/data/projects";

export interface StudioConnection {
  /** id of the StudioNode this connection leads to. */
  targetNodeId: string;
  /** 3D position (world space, on/near the inside of the panorama sphere)
   * the hotspot is anchored to — never a 2D screen percentage. */
  position: [number, number, number];
  label: string;
}

export interface StudioArtwork {
  /** 3D position anchor, same convention as StudioConnection.position. */
  position: [number, number, number];
  /** Project shown on click — sourced from PROJECTS (src/data/projects.ts)
   * so this stays a single source of truth with the homepage's own work
   * gallery, instead of a second hand-written copy of the same content. */
  project: (typeof PROJECTS)[number];
}

export interface StudioInfoHotspot {
  /** 3D position anchor, same convention as StudioConnection.position. */
  position: [number, number, number];
  label: string;
  title: string;
  body: string;
}

export interface StudioNode {
  id: string;
  name: string;
  /** Short room code shown in the HUD ("P01"). */
  room: string;
  /** Short line shown under the title in StudioRoomPanel. */
  subtitle: string;
  /** A couple of sentences describing the room, shown in StudioRoomPanel —
   * distinct from `name`/`room`, which are just the compact HUD label. */
  description: string;
  /** Path under /public to this node's equirectangular panorama texture —
   * empty string for nodes that aren't `available` yet (nothing tries to
   * load it in that case). */
  panorama: string;
  /** Camera orientation on arrival — tuned per-node so the visitor lands
   * facing the room's main passage, not a wall or the panorama's seam. */
  initialYaw: number;
  initialPitch: number;
  /** False disables mouse-wheel/pinch FOV changes for this node entirely
   * (CameraController.tsx) — used on P02, where the framed project visuals
   * are AI-upscaled and read worse the closer the camera "zooms" into them. */
  zoomEnabled: boolean;
  /** False for rooms scaffolded in StudioRoomCarousel/StudioRoomPanel's
   * room count but with no real panorama yet — shown as "Bientôt
   * disponible", never enterable, no connection ever targets one. */
  available: boolean;
  connections: StudioConnection[];
  artworks: StudioArtwork[];
  infoHotspots: StudioInfoHotspot[];
}

export const STUDIO_CAMERA_HEIGHT_M = 1.65;

export const STUDIO_ENTRY_NODE_ID = "p01";

export const STUDIO_NODES: Record<string, StudioNode> = {
  p01: {
    id: "p01",
    name: "Portal",
    room: "P01",
    subtitle: "Entrée du studio",
    description: "Un seuil entre les idées et le réel. Le Portal vous accueille dans l'univers KOV, une expérience immersive au cœur de la création digitale.",
    panorama: "/studio/panoramas/p01.webp",
    // The texture's horizontal center already frames the lit passage/arch
    // — the natural "face forward" direction — so yaw 0 needs no offset.
    // The panorama's seam (±180° longitude) falls at the texture's left/
    // right edges, i.e. directly behind this orientation, well away from
    // the passage that draws the eye on arrival.
    initialYaw: 0,
    initialPitch: 0,
    zoomEnabled: true,
    available: true,
    connections: [
      {
        targetNodeId: "p02",
        // Aimed at the lit passage straight ahead, slightly below eye
        // level. Positions below were derived analytically from the
        // static source images (equirect pixel → yaw/pitch, then
        // yaw/pitch → world XYZ via the same atan2(x,-z) relation
        // StudioExperience.tsx already uses the other way around) rather
        // than eyeballed live — StudioDebugPanel's yaw/pitch/FOV readout
        // (dev-only) is the place to nudge these further if they read off
        // once actually walked through.
        position: [0, -30, -480],
        label: "Design Studio",
      },
    ],
    artworks: [],
    // Copy adapted from the homepage/expertise intro copy — not an
    // invented company history/founding date. "La philosophie KOV"
    // reuses the Design pillar's own real positioning line verbatim
    // (src/data/expertisePillars.ts) rather than writing a second,
    // divergent version of the same claim.
    infoHotspots: [
      {
        position: [-280, -20, -200],
        label: "Notre histoire",
        title: "Notre histoire",
        body: "KOV est né d'un constat simple : la plupart des sites ne construisent rien qui compte vraiment. On a choisi de faire différemment — un studio qui privilégie la structure à l'esthétique de façade, et le résultat à la promesse.",
      },
      {
        position: [280, -20, -200],
        label: "La philosophie KOV",
        title: "La philosophie KOV",
        body: "On conçoit des interfaces comme on construit une architecture — la structure vient avant le style. Le design clarifie et guide ; il ne masque jamais un problème de fond.",
      },
    ],
  },
  p02: {
    id: "p02",
    name: "Design Studio",
    room: "P02",
    subtitle: "Concevoir demain",
    description: "L'atelier où les idées prennent forme. Chaque projet affiché ici est une conversation entre stratégie, design et développement.",
    panorama: "/studio/panoramas/p02.webp",
    // The reception desk / glass facade sits at the texture's horizontal
    // center, symmetric portrait walls to either side — the natural
    // "face forward" arrival framing, same reasoning as P01's yaw 0. The
    // seam falls at the image's left/right edges, off in the peripheral
    // plant/glass area rather than across the gallery walls themselves.
    initialYaw: 0,
    initialPitch: 0,
    // AI-upscaled source (8x, same honest-upscale caveat as P01's own
    // panorama) — zooming in just magnifies upscaler artifacts on the
    // framed pieces, so FOV is locked to DEFAULT_FOV instead of pretending
    // this holds up to a closer look.
    zoomEnabled: false,
    available: true,
    connections: [
      {
        targetNodeId: "p01",
        // Directly behind the arrival orientation (yaw π from initialYaw
        // 0) — the passage back to P01 is the way the visitor just came
        // from, so finding it means turning around, same convention as a
        // real walkthrough rather than a hotspot conveniently in view.
        position: [0, -30, 480],
        label: "Portal",
      },
    ],
    // Four framed pieces on the gallery walls, wired to PROJECTS in
    // arrival order (Kanti is live; the other three are the honest
    // "Projet à venir" placeholders already used on the homepage — see
    // KovProjectCard.tsx). The panorama also shows a few more painted
    // frames ("KOV — Creative Studio", "H Capital — Investment") than
    // PROJECTS has real entries for; those are left as plain decoration
    // rather than wired to fabricated project content.
    artworks: [
      { position: [-300, 80, 362], project: PROJECTS[0] },
      { position: [-447, 80, 145], project: PROJECTS[1] },
      { position: [-350, 80, -314], project: PROJECTS[2] },
      { position: [456, 80, 114], project: PROJECTS[3] },
    ],
    infoHotspots: [],
  },
  // Scaffolded so StudioRoomPanel/StudioRoomCarousel have all 6 real
  // entries to render a room count and a "Bientôt disponible" tile
  // against — not enterable (available: false, no panorama, nothing
  // connects to them). Names/subtitles match the reference concept
  // board; swap `available: true` + fill in the rest once each has a
  // real panorama.
  p03: {
    id: "p03",
    name: "Galerie Projets",
    room: "P03",
    subtitle: "Nos réalisations",
    description: "Bientôt disponible.",
    panorama: "",
    initialYaw: 0,
    initialPitch: 0,
    zoomEnabled: true,
    available: false,
    connections: [],
    artworks: [],
    infoHotspots: [],
  },
  p04: {
    id: "p04",
    name: "Motion Room",
    room: "P04",
    subtitle: "Donner vie aux idées",
    description: "Bientôt disponible.",
    panorama: "",
    initialYaw: 0,
    initialPitch: 0,
    zoomEnabled: true,
    available: false,
    connections: [],
    artworks: [],
    infoHotspots: [],
  },
  p05: {
    id: "p05",
    name: "Dev Lab",
    room: "P05",
    subtitle: "Builder l'impossible",
    description: "Bientôt disponible.",
    panorama: "",
    initialYaw: 0,
    initialPitch: 0,
    zoomEnabled: true,
    available: false,
    connections: [],
    artworks: [],
    infoHotspots: [],
  },
  p06: {
    id: "p06",
    name: "Salle Immersive",
    room: "P06",
    subtitle: "Expériences sans limites",
    description: "Bientôt disponible.",
    panorama: "",
    initialYaw: 0,
    initialPitch: 0,
    zoomEnabled: true,
    available: false,
    connections: [],
    artworks: [],
    infoHotspots: [],
  },
};

// Ordered room list (StudioRoomPanel's "N/6", StudioRoomCarousel's strip)
// — Object.values on STUDIO_NODES isn't guaranteed to preserve this exact
// order across engines, so it's declared explicitly here instead.
export const STUDIO_NODE_ORDER = ["p01", "p02", "p03", "p04", "p05", "p06"];
