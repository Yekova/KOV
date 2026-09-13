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
  | "graphite"
  | "wood"
  | "glass"
  | "warmLight"
  | "kovRed"
  | "floorStone"
  | "floorWood"
  | "floorCarpet"
  | "fabric"
  | "foliage";

// Typed as `Record<PaletteKey, MaterialSpec>` (an annotation, not `as
// const satisfies`) so every entry is treated as the full MaterialSpec
// shape — the optional fields (emissive, transparent, ...) read back as
// genuinely optional (`string | undefined`) wherever they're actually
// used, rather than TypeScript narrowing each entry down to only the
// properties its own literal happened to include.
export const STUDIO_MAP_PALETTE: Record<PaletteKey, MaterialSpec> = {
  darkStone: { color: "#1c1b19", roughness: 0.85, metalness: 0.1 },
  graphite: { color: "#161616", roughness: 0.6, metalness: 0.35 },
  wood: { color: "#2b1f16", roughness: 0.7, metalness: 0.05 },
  glass: { color: "#2a3236", roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.45 },
  warmLight: { color: "#3a2a1c", roughness: 0.4, metalness: 0, emissive: "#e8a55c", emissiveIntensity: 0.35 },
  kovRed: { color: "#3a0d0f", roughness: 0.5, metalness: 0.2, emissive: "#e31e24", emissiveIntensity: 0.6 },
  floorStone: { color: "#141414", roughness: 0.9, metalness: 0.05 },
  floorWood: { color: "#241a12", roughness: 0.8, metalness: 0.02 },
  floorCarpet: { color: "#1b1613", roughness: 1, metalness: 0 },
  fabric: { color: "#2a2622", roughness: 0.95, metalness: 0 },
  foliage: { color: "#1e2b1c", roughness: 0.9, metalness: 0 },
};

export type StudioMapMaterialKey = PaletteKey;
