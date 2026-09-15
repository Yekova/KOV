// Shared material palette for the 3D studio map. These are plain specs —
// the actual THREE.Material instances are built once per Canvas and
// mutualised through StudioMapMaterials.tsx's context, so ~250 meshes
// share ~60 materials rather than allocating one each.
export interface MaterialSpec {
  color: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}

type PaletteKey =
  // structure
  | "blackStone"
  | "darkStone"
  | "graphite"
  | "concrete"
  | "wallTrim"
  | "warmMetal"
  // floors
  | "floorStone"
  | "floorWood"
  | "floorCarpet"
  | "floorConcrete"
  | "floorDeck"
  | "corridor"
  // surfaces
  | "darkWood"
  | "smokedGlass"
  | "screen"
  | "fabricDark"
  | "fabricLight"
  | "foliage"
  | "planter"
  // accents
  | "kovRed"
  | "kovRedSoft"
  | "warmEmissive"
  | "coolEmissive";

// Values tuned for a dark scene that still reads: walls sit a clear step
// lighter than floors, furniture a step lighter again, metal/trim
// brightest. Roughness is deliberately spread out (stone high, metal low)
// since with this little light, roughness contrast is doing most of the
// work of separating materials.
export const STUDIO_MAP_PALETTE: Record<PaletteKey, MaterialSpec> = {
  blackStone: { color: "#1b1b19", roughness: 0.92, metalness: 0.05 },
  darkStone: { color: "#4d4a42", roughness: 0.78, metalness: 0.1 },
  graphite: { color: "#4f4d45", roughness: 0.65, metalness: 0.2 },
  concrete: { color: "#59564d", roughness: 0.85, metalness: 0.05 },
  wallTrim: { color: "#857f71", roughness: 0.4, metalness: 0.45 },
  warmMetal: { color: "#8d7659", roughness: 0.32, metalness: 0.68 },

  floorStone: { color: "#2f2f2b", roughness: 0.68, metalness: 0.07 },
  floorWood: { color: "#4d351a", roughness: 0.56, metalness: 0.04 },
  floorCarpet: { color: "#3a332b", roughness: 1, metalness: 0 },
  floorConcrete: { color: "#373530", roughness: 0.76, metalness: 0.05 },
  floorDeck: { color: "#454037", roughness: 0.74, metalness: 0.06 },
  corridor: { color: "#3d3a34", roughness: 0.66, metalness: 0.09 },

  darkWood: { color: "#6a4c2e", roughness: 0.52, metalness: 0.06 },
  smokedGlass: { color: "#7093a3", roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.3 },
  screen: { color: "#1b262d", roughness: 0.16, metalness: 0.4, emissive: "#4f88ad", emissiveIntensity: 0.55 },
  fabricDark: { color: "#575144", roughness: 0.92, metalness: 0 },
  fabricLight: { color: "#948874", roughness: 0.88, metalness: 0 },
  foliage: { color: "#426637", roughness: 0.82, metalness: 0 },
  planter: { color: "#5d5448", roughness: 0.78, metalness: 0.06 },

  kovRed: { color: "#4a1114", roughness: 0.5, metalness: 0.2, emissive: "#e31e24", emissiveIntensity: 0.7 },
  kovRedSoft: { color: "#331316", roughness: 0.6, metalness: 0.1, emissive: "#e31e24", emissiveIntensity: 0.24 },
  // ~2900K interior lighting, faked with emissive strips rather than real
  // point lights (dozens of dynamic lights would cost far more than this
  // map is allowed to).
  warmEmissive: { color: "#6a4d2e", roughness: 0.4, metalness: 0, emissive: "#ffc184", emissiveIntensity: 1.6 },
  coolEmissive: { color: "#3a424c", roughness: 0.4, metalness: 0, emissive: "#d9e8f7", emissiveIntensity: 1.25 },
};

export type StudioMapMaterialKey = PaletteKey;
