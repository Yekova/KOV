"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

const SPHERE_RADIUS = 500;

interface PanoramaSphereProps {
  texture: THREE.Texture;
}

// The panorama projected onto the inside of a large sphere, camera at its
// center (studio spec §05). scale={[-1,1,1]} un-mirrors the texture (the
// standard technique — matches Three.js's own equirectangular-panorama
// example) by flipping face winding so the sphere's front face points
// inward. side={THREE.DoubleSide} is a deliberate safety net on top of
// that: it was diagnosed live that the sphere wasn't rendering at all
// (visible proof: a fallback scene background was showing through
// instead) even though the texture had confirmed-loaded — consistent with
// a winding/culling mismatch specific to this Three.js/R3F version rather
// than the texture itself. DoubleSide makes the surface draw regardless
// of which way winding resolves, at the cost of also rendering the outward
// face — negligible for a single sphere, and worth it to guarantee
// visibility over a "should be correct in theory" assumption that already
// failed once in practice.
export function PanoramaSphere({ texture }: PanoramaSphereProps) {
  const { gl } = useThree();

  useEffect(() => {
    // The renderer's real max anisotropy (commonly 16 on desktop GPUs, can
    // be lower on mobile/integrated) — was previously left at Three.js's
    // default of 1 (no anisotropic filtering at all). Requires the
    // mipmapped minFilter set in StudioExperience.tsx's loader; anisotropy
    // has nothing to filter across without a mip chain.
    // react-hooks/immutability doesn't know R3F's model — configuring a
    // live Three.js texture imperatively is normal here (same reasoning
    // as CameraController.tsx's camera mutations).
    // eslint-disable-next-line react-hooks/immutability
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    texture.needsUpdate = true;
  }, [texture, gl]);

  return (
    // frustumCulled=false — the camera sits exactly at this sphere's
    // center, so it should always be well inside the view frustum
    // regardless, but this removes even the theoretical possibility of a
    // bounding-sphere/negative-scale edge case culling the whole mesh.
    <mesh scale={[-1, 1, 1]} frustumCulled={false}>
      <sphereGeometry args={[SPHERE_RADIUS, 64, 40]} />
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
