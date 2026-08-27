"use client";

import * as THREE from "three";
import { useRef, useState } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { useFBO, MeshTransmissionMaterial } from "@react-three/drei";
import { easing } from "maath";

// Adapted from React Bits' FluidGlass (reactbits.dev) — stripped to just the
// refractive core: an FBO render-to-texture pass feeding MeshTransmissionMaterial,
// plus pointer-following easing. Dropped from the source: the "bar"/"cube"
// modes and their nav-item text, the lens.glb/bar.glb/cube.glb models (no 3D
// asset ships with this repo, and a primitive sphere reads as a "liquid
// glass droplet" just as well without needing one), and the
// ScrollControls-driven image/typography gallery — that's React Bits' own
// demo content ("React Bits" text, placeholder photos), not anything KOV has
// to show there. What's refracted is a couple of KOV-toned lights against a
// near-black scene instead of the source's default purple clear color, so
// the glass reads as part of this page rather than a borrowed demo.
function GlassBlob() {
  const meshRef = useRef<THREE.Mesh>(null);
  const buffer = useFBO();
  const { viewport } = useThree();
  const [portalScene] = useState(() => new THREE.Scene());

  useFrame((state, delta) => {
    const { gl, pointer, camera } = state;
    if (meshRef.current) {
      const destX = (pointer.x * viewport.width) / 6;
      const destY = (pointer.y * viewport.height) / 6;
      easing.damp3(meshRef.current.position, [destX, destY, 0], 0.25, delta);
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x += delta * 0.05;
    }

    gl.setRenderTarget(buffer);
    gl.setClearColor("#111111", 1);
    gl.render(portalScene, camera);
    gl.setRenderTarget(null);
  });

  // Six small emissive points arranged in a ring inside the portal scene —
  // what the glass refracts isn't an empty void, it's a distorted echo of
  // the six chips that just converged here. Gives the transmission material
  // real color/light to bend (a near-black scene alone reads as a flat
  // dark disc, not glass), while staying thematically tied to the moment
  // rather than being arbitrary demo filler.
  const accents = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    return { position: [Math.cos(angle) * 0.65, Math.sin(angle) * 0.65, 0] as const, color: i % 2 === 0 ? "#e31e24" : "#f9f9f9" };
  });

  return (
    <>
      {createPortal(
        <>
          <ambientLight intensity={0.45} />
          <pointLight position={[3, 3, 4]} intensity={55} color="#e31e24" />
          <pointLight position={[-3, -2, 3]} intensity={28} color="#f9f9f9" />
          {accents.map((accent, i) => (
            <mesh key={i} position={accent.position}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshBasicMaterial color={accent.color} />
            </mesh>
          ))}
        </>,
        portalScene
      )}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.4, 64, 64]} />
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={1.2}
          thickness={1.8}
          anisotropy={0.03}
          chromaticAberration={0.08}
          roughness={0.03}
          transmission={1}
          color="#f9f9f9"
        />
      </mesh>
    </>
  );
}

// Ambient decorative canvas — no click/scroll handling of its own, safe to
// drop into a section that already owns real scroll/pin behavior elsewhere.
export function FluidGlassOrb({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} gl={{ alpha: true }} dpr={[1, 1.5]}>
        <GlassBlob />
      </Canvas>
    </div>
  );
}
