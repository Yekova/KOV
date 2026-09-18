"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

const LOGO_SRC = "/kov/brand/kov-monogram-k-transparent.png";

// How far below the camera the mark sits, and how wide it is. The camera is
// at the sphere's centre and the panorama's floor is painted on the sphere
// itself, so these two numbers only decide the angle the mark subtends: at
// y = -150 a radius of 78 covers about 27° out from straight down. Enough to
// read as standing on it, small enough that looking level never shows it.
const DROP = 150;
const RADIUS = 78;

// The KOV mark on the floor, under the visitor, in every room.
//
// This is the nadir patch every 360° tour has: the bottom of an
// equirectangular panorama is where the projection stretches worst and where
// the tripod would have stood, so it is conventionally covered. Covering it
// with the studio's own monogram turns a defect into the one piece of
// branding that is genuinely part of the space rather than laid over it.
//
// Loaded imperatively rather than through drei's useTexture: the studio's
// canvas has no Suspense boundary (the panorama itself is loaded the same
// way in StudioExperience), and adding one around the whole scene to fetch a
// 120 KB logo would be the wrong trade.
export function StudioFloorMark() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(LOGO_SRC, (loaded) => {
      if (cancelled) {
        loaded.dispose();
        return;
      }
      loaded.colorSpace = THREE.SRGBColorSpace;
      setTexture(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture) return null;

  return (
    <group position={[0, -DROP, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* A soft disc under the mark so it reads as a plate on the floor
          rather than a decal floating on the carpet, and so the monogram
          keeps its contrast whatever the room underneath is doing. */}
      <mesh renderOrder={1}>
        <circleGeometry args={[RADIUS, 64]} />
        <meshBasicMaterial
          color="#0a0a0a"
          transparent
          opacity={0.42}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* A thin red rim, not a filled plate: a red disc under the visitor
          would tint the whole lower third of the view. */}
      <mesh position={[0, 0, 0.5]} renderOrder={2}>
        <ringGeometry args={[RADIUS * 0.985, RADIUS, 64]} />
        <meshBasicMaterial color="#e31e24" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </mesh>

      <mesh position={[0, 0, 1]} renderOrder={3}>
        <planeGeometry args={[RADIUS * 1.05, RADIUS * 1.05]} />
        <meshBasicMaterial
          map={texture}
          transparent
          opacity={0.72}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
