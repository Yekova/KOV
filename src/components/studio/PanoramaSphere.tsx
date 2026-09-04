"use client";

import type * as THREE from "three";

const SPHERE_RADIUS = 500;

interface PanoramaSphereProps {
  texture: THREE.Texture;
}

// The panorama projected onto the inside of a large sphere, camera at its
// center (studio spec §05). scale={[-1,1,1]} — not side={THREE.BackSide}
// — is the standard, correct technique for this (matches Three.js's own
// equirectangular-panorama example): negating the mesh's X scale flips
// face winding so the sphere's front face points inward toward the camera
// AND simultaneously un-mirrors the texture, which BackSide alone would
// leave flipped left-right.
//
// Takes an already-loaded texture rather than a URL + its own useTexture()
// call — StudioExperience loads it once via a plain TextureLoader (needed
// anyway to know when the intro button should go live) and hands the same
// object down here. Two separate loaders hitting the same URL should
// converge to the same result, but they're two different code paths with
// two different completion signals — simpler and more robust to only ever
// have one loader and one source of truth for "is the texture ready".
export function PanoramaSphere({ texture }: PanoramaSphereProps) {
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[SPHERE_RADIUS, 64, 40]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
