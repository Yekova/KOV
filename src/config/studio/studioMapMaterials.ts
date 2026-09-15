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
  blackStone: { color: "#0d0d0c", roughness: 0.95, metalness: 0.05 },
  darkStone: { color: "#2b2a26", roughness: 0.82, metalness: 0.08 },
  graphite: { color: "#35342f", roughness: 0.7, metalness: 0.18 },
  concrete: { color: "#3a3833", roughness: 0.88, metalness: 0.04 },
  wallTrim: { color: "#5d594f", roughness: 0.45, metalness: 0.4 },
  warmMetal: { color: "#6b5a44", roughness: 0.35, metalness: 0.65 },

  floorStone: { color: "#1a1a18", roughness: 0.72, metalness: 0.06 },
  floorWood: { color: "#33220f", roughness: 0.6, metalness: 0.03 },
  floorCarpet: { color: "#241f19", roughness: 1, metalness: 0 },
  floorConcrete: { color: "#201f1d", roughness: 0.8, metalness: 0.04 },
  floorDeck: { color: "#2a2723", roughness: 0.78, metalness: 0.05 },
  corridor: { color: "#232220", roughness: 0.7, metalness: 0.08 },

  darkWood: { color: "#4a3520", roughness: 0.55, metalness: 0.05 },
  smokedGlass: { color: "#4a6470", roughness: 0.08, metalness: 0.25, transparent: true, opacity: 0.28 },
  screen: { color: "#121a20", roughness: 0.18, metalness: 0.4, emissive: "#3d6b8a", emissiveIntensity: 0.35 },
  fabricDark: { color: "#3b362d", roughness: 0.95, metalness: 0 },
  fabricLight: { color: "#6b6152", roughness: 0.9, metalness: 0 },
  foliage: { color: "#2f4a28", roughness: 0.85, metalness: 0 },
  planter: { color: "#40392f", roughness: 0.8, metalness: 0.05 },

  kovRed: { color: "#3a0d0f", roughness: 0.5, metalness: 0.2, emissive: "#e31e24", emissiveIntensity: 0.55 },
  kovRedSoft: { color: "#2a1012", roughness: 0.6, metalness: 0.1, emissive: "#e31e24", emissiveIntensity: 0.18 },
  // ~2900K interior lighting, faked with emissive strips rather than real
  // point lights (dozens of dynamic lights would cost far more than this
  // map is allowed to).
  warmEmissive: { color: "#4a3520", roughness: 0.4, metalness: 0, emissive: "#ffb46b", emissiveIntensity: 1.1 },
  coolEmissive: { color: "#2a3038", roughness: 0.4, metalness: 0, emissive: "#c9ddf0", emissiveIntensity: 0.85 },
};

export type StudioMapMaterialKey = PaletteKey;
