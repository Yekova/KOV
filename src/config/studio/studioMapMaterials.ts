// Shared material palette for the 3D studio map (StudioMap3D and
// friends) — plain color/roughness/metalness values read by JSX
// `<meshStandardMaterial>` tags, not literal shared THREE.Material
// instances (R3F already manages per-mesh material lifecycles; sharing
// values here is what avoids every mesh inventing its own ad-hoc color,
// which is the actual thing worth centralizing).
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
  | "darkStone"
  | "wallCap"
  | "graphite"
  | "wood"
  | "glass"
  | "warmLight"
  | "kovRed"
  | "kovRedSoft"
  | "floorStone"
  | "floorWood"
  | "floorCarpet"
  | "corridor"
  | "fabric"
  | "foliage";

// Typed as `Record<PaletteKey, MaterialSpec>` (an annotation, not `as
// const satisfies`) so every entry is treated as the full MaterialSpec
// shape — the optional fields (emissive, transparent, ...) read back as
// genuinely optional (`string | undefined`) wherever they're actually
// used, rather than TypeScript narrowing each entry down to only the
// properties its own literal happened to include.
//
// Phase-2 pass: walls lifted a shade lighter/cooler than the floors (was
// nearly the same value as the floor, which is exactly what made the
// whole scene read as one undifferentiated dark mass) and furniture
// pushed warmer/lighter so it actually pops against dark floors instead
// of disappearing into them.
export const STUDIO_MAP_PALETTE: Record<PaletteKey, MaterialSpec> = {
  darkStone: { color: "#26261f", roughness: 0.8, metalness: 0.12 },
  wallCap: { color: "#4a4740", roughness: 0.5, metalness: 0.25 },
  graphite: { color: "#1c1c1c", roughness: 0.55, metalness: 0.4 },
  wood: { color: "#3d2a18", roughness: 0.65, metalness: 0.04 },
  glass: { color: "#31434a", roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.42 },
  warmLight: { color: "#3a2a1c", roughness: 0.4, metalness: 0, emissive: "#e8a55c", emissiveIntensity: 0.5 },
  kovRed: { color: "#3a0d0f", roughness: 0.5, metalness: 0.2, emissive: "#e31e24", emissiveIntensity: 0.55 },
  kovRedSoft: { color: "#2a1012", roughness: 0.6, metalness: 0.1, emissive: "#e31e24", emissiveIntensity: 0.22 },
  floorStone: { color: "#121212", roughness: 0.9, metalness: 0.05 },
  floorWood: { color: "#20150c", roughness: 0.75, metalness: 0.02 },
  floorCarpet: { color: "#17130f", roughness: 1, metalness: 0 },
  corridor: { color: "#1d1a15", roughness: 0.85, metalness: 0.05 },
  fabric: { color: "#3c362d", roughness: 0.9, metalness: 0 },
  foliage: { color: "#233521", roughness: 0.85, metalness: 0 },
};

export type StudioMapMaterialKey = PaletteKey;
