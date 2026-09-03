"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

const SPHERE_RADIUS = 500;

interface PanoramaSphereProps {
  textureUrl: string;
}

// The panorama projected onto the inside of a large sphere, camera at its
// center (studio spec §05). scale={[-1,1,1]} — not side={THREE.BackSide}
// — is the standard, correct technique for this (matches Three.js's own
// equirectangular-panorama example): negating the mesh's X scale flips
// face winding so the sphere's front face points inward toward the camera
// AND simultaneously un-mirrors the texture, which BackSide alone would
// leave flipped left-right. Suspends via drei's useTexture — the parent
// wraps this in <Suspense> so "loading" state is handled once, above the
// scene, not per-mesh.
export function PanoramaSphere({ textureUrl }: PanoramaSphereProps) {
  const texture = useTexture(textureUrl);

  useEffect(() => {
    // react-hooks/immutability doesn't know R3F's model — a Three.js
    // texture is a live imperative object, mutating its own properties is
    // the normal way to configure it (same reasoning as
    // CameraController.tsx's camera mutations).
    // eslint-disable-next-line react-hooks/immutability
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return () => {
      // Only this node's own texture — useTexture's internal cache is
      // keyed by URL, so disposing here doesn't affect other nodes still
      // holding their own texture instances (studio spec §34).
      texture.dispose();
    };
  }, [texture]);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[SPHERE_RADIUS, 64, 40]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
