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
      {
        targetNodeId: "p06",
        // Unlike the P02 hotspot above, this one wasn't derived from the
        // real P01 texture's own geometry (no reference to re-derive
        // yaw/pitch from for a second passage) — an invented placement to
        // the side of the arrival view, same "you can invent the room
        // layout for now" latitude already used for the HUD mini-map's
        // floor plan. Worth nudging via StudioDebugPanel once walked
        // through live.
        position: [420, -20, -260],
        label: "Lounge",
      },
      {
        targetNodeId: "p07",
        // Same invented-placement latitude as the Lounge connection
        // above — no real second-passage geometry to derive this from
        // either. Placed on the opposite side of the arrival view from
        // the Lounge so the two branches don't overlap.
        position: [-420, -20, -260],
        label: "Rooftop",
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
        body: "KOV est né d'un constat simple : la plupart des sites ne construisent rien qui compte vraiment. On a choisi de faire différemment, avec un studio qui privilégie la structure à l'esthétique de façade, et le résultat à la promesse.",
      },
      {
        position: [280, -20, -200],
        label: "La philosophie KOV",
        title: "La philosophie KOV",
        body: "On conçoit des interfaces comme on construit une architecture : la structure vient avant le style. Le design clarifie et guide ; il ne masque jamais un problème de fond.",
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
    // Kept at 0 with the new panorama, but unverified: the previous value
    // was derived from the old texture's own geometry (reception desk at
    // the horizontal centre, symmetric walls either side) and that reasoning
    // does not carry over to a different photograph. If the arrival framing
    // reads off once walked through, StudioDebugPanel's yaw/pitch readout is
    // where to correct it.
    initialYaw: 0,
    initialPitch: 0,
    // AI-upscaled source (Upscayl), downsampled to 6144x3072 like every other
    // room: the file arrived at 8870 wide, above the 8192 MAX_TEXTURE_SIZE a
    // lot of integrated GPUs report, where the upload either fails or gets
    // silently downscaled by the driver. Zoom stays enabled, same as every
    // other room, despite the upscale.
    zoomEnabled: true,
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
    // Removed by request. These were four hotspots on the gallery walls,
    // each opening a project panel — three of them on "Projet à venir"
    // placeholders rather than real work. Their coordinates were derived
    // from the *previous* panorama's own geometry anyway, so they would
    // have pointed at nothing in particular on this one.
    //
    // The machinery is untouched (ArtworkHotspotLayer renders nothing on an
    // empty array): re-enabling them is a matter of putting entries back
    // here, which is what the scaffolded Galerie Projets room will want.
    artworks: [],
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
    name: "Lounge",
    room: "P06",
    subtitle: "Un temps pour souffler",
    description:
      "Un salon pensé pour ralentir : lumière tamisée, feu de cheminée, grandes baies vitrées. Le seul espace du studio pensé pour une pause, pas pour produire.",
    panorama: "/studio/panoramas/p06.webp",
    // Real photo (heavily AI-upscaled — "upscayl 5x", same honest caveat
    // as P01/P02's own sources), horizontal center already frames the
    // sofa/fireplace wall — the natural "face forward" arrival, same
    // convention as P01/P02's own yaw 0.
    initialYaw: 0,
    initialPitch: 0,
    // A 5x AI upscale is a heavy one, but zoom is re-enabled here per
    // explicit request — every room now matches the Portal's own
    // zoomEnabled: true rather than each upscaled room getting its own
    // conservative default.
    zoomEnabled: true,
    available: true,
    connections: [
      {
        targetNodeId: "p01",
        // Directly behind the arrival orientation, same "turn around to
        // find the way back" convention P02 uses for its own return
        // connection.
        position: [0, -30, 480],
        label: "Portal",
      },
    ],
    // The framed photos already visible on this room's own gallery wall
    // are left as plain decoration (same call already made for P02's
    // extra painted frames) rather than wired to fabricated project data.
    artworks: [],
    infoHotspots: [
      {
        position: [-260, -10, -180],
        label: "Une pause, pas une pose",
        title: "Une pause, pas une pose",
        body: "Chaque studio a besoin d'un endroit où ralentir. Ce salon existe pour ça : un feu, une vue, et une ambiance sonore pensée pour souffler entre deux idées.",
      },
    ],
  },
  p07: {
    id: "p07",
    name: "Rooftop",
    room: "P07",
    subtitle: "Prendre de la hauteur",
    description:
      "Une terrasse ouverte sur les montagnes — l'endroit du studio pensé pour prendre du recul avant de redescendre dans le détail.",
    panorama: "/studio/panoramas/p07.webp",
    // Real photo (AI-upscaled — "upscayl 5x", same honest caveat as every
    // other real panorama here), horizontal center already frames the
    // pergola's own peak and the mountain/lake view beyond it — the
    // natural "face forward" arrival, same convention as every other
    // room's own yaw 0.
    initialYaw: 0,
    initialPitch: 0,
    zoomEnabled: true,
    available: true,
    connections: [
      {
        targetNodeId: "p01",
        // Directly behind the arrival orientation, same "turn around to
        // find the way back" convention every other room's return
        // connection uses.
        position: [0, -30, 480],
        label: "Portal",
      },
    ],
    artworks: [],
    // "Éclairer les possibles" / this body line are the Stratégie
    // pillar's own real copy (src/data/expertisePillars.ts), reused
    // verbatim for the same reason P01's own hotspots reuse the Design
    // pillar's line — a rooftop view read naturally as "gaining
    // perspective/altitude," not an invented backstory for this room.
    infoHotspots: [
      {
        position: [-260, -10, -180],
        label: "Éclairer les possibles",
        title: "Éclairer les possibles",
        body: "Positionnement, architecture et parcours utilisateur. Avant de dessiner une interface, on décide ce qu'elle doit dire, à qui et pourquoi.",
      },
    ],
  },
};

// Ordered room list (StudioRoomPanel's "N/7", StudioRoomCarousel's strip)
// — Object.values on STUDIO_NODES isn't guaranteed to preserve this exact
// order across engines, so it's declared explicitly here instead.
export const STUDIO_NODE_ORDER = ["p01", "p02", "p03", "p04", "p05", "p06", "p07"];
