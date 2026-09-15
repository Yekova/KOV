"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { STUDIO_MAP_PALETTE, type StudioMapMaterialKey } from "@/config/studio/studioMapMaterials";

/** `dim0`/`dim1` are the level-filter variants: identical to `full` until
 * the level selector fades them (StudioMapScene animates their opacity),
 * kept as separate material instances so one level can fade without
 * touching the other. `faint` is the permanent "room not available yet"
 * treatment. */
export type MaterialVariant = "full" | "dim0" | "dim1" | "faint";

const FAINT_OPACITY = 0.3;

type MaterialStore = {
  materials: Map<string, THREE.MeshStandardMaterial>;
  dimGroups: { 0: THREE.MeshStandardMaterial[]; 1: THREE.MeshStandardMaterial[] };
};

const MaterialContext = createContext<MaterialStore | null>(null);

function buildStore(): MaterialStore {
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const dimGroups: MaterialStore["dimGroups"] = { 0: [], 1: [] };
  const variants: MaterialVariant[] = ["full", "dim0", "dim1", "faint"];

  (Object.keys(STUDIO_MAP_PALETTE) as StudioMapMaterialKey[]).forEach((key) => {
    const spec = STUDIO_MAP_PALETTE[key];
    variants.forEach((variant) => {
      const baseOpacity = spec.opacity ?? 1;
      const opacity = variant === "faint" ? baseOpacity * FAINT_OPACITY : baseOpacity;
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(spec.color),
        roughness: spec.roughness,
        metalness: spec.metalness,
        emissive: new THREE.Color(spec.emissive ?? "#000000"),
        emissiveIntensity: spec.emissiveIntensity ?? 0,
        transparent: variant !== "full" || Boolean(spec.transparent),
        opacity,
        depthWrite: variant === "full" || !spec.transparent,
      });
      material.name = `${key}:${variant}`;
      // StudioMapScene's LevelDimmer scales opacity by a single factor per
      // level, so each material has to remember what "full" meant for it
      // (smoked glass is never opaque, for instance).
      material.userData.baseOpacity = opacity;
      materials.set(material.name, material);
      if (variant === "dim0") dimGroups[0].push(material);
      if (variant === "dim1") dimGroups[1].push(material);
    });
  });

  return { materials, dimGroups };
}

// One store per Canvas (mini and expanded each get their own), built once
// and disposed on unmount — no module-level singletons left dangling, and
// no per-mesh material allocation.
export function StudioMapMaterialsProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => buildStore(), []);

  useEffect(() => {
    return () => {
      store.materials.forEach((material) => material.dispose());
    };
  }, [store]);

  return <MaterialContext.Provider value={store}>{children}</MaterialContext.Provider>;
}

export function useStudioMaterials() {
  const store = useContext(MaterialContext);
  if (!store) throw new Error("useStudioMaterials must be used inside StudioMapMaterialsProvider");
  return store;
}

export function useStudioMaterial(key: StudioMapMaterialKey, variant: MaterialVariant) {
  const { materials } = useStudioMaterials();
  return materials.get(`${key}:${variant}`)!;
}
