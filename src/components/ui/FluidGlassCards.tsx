"use client";

import * as THREE from "three";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { useFBO, useTexture, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";

interface FluidGlassCardsProps {
  count: number;
  texture: string;
  className?: string;
}

// The same photo real DOM content sits on (passed in as `texture`),
// rendered again here as a WebGL plane purely so the glass cards have
// something real to refract — a flat black portal scene reads as opaque
// dark panes, not glass. Not visible directly (it sits behind the cards,
// inside the FBO-only portal scene), so it doesn't need to line up with
// the real photo pixel-for-pixel, just be recognizably the same room.
function Backdrop({ textureUrl }: { textureUrl: string }) {
  const map = useTexture(textureUrl);
  const { viewport } = useThree();
  return (
    <mesh position={[0, 0, -2]}>
      <planeGeometry args={[viewport.width * 1.4, viewport.height * 1.4]} />
      <meshBasicMaterial map={map} />
    </mesh>
  );
}

// A responsive grid of flat glass cards (RoundedBox + MeshTransmissionMaterial)
// sharing one FBO buffer/render pass — cheap regardless of card count, since
// only the shared portal scene needs re-rendering each frame, not once per
// card. Grid math (cols/rows, cell centers) mirrors the CSS grid the real
// DOM text overlay uses (see ExpertiseTeaser.tsx) via the same 640px
// breakpoint, so the two layers land in the same cells without needing
// pixel-exact DOM-to-3D coordinate syncing.
function CardGrid({ count, textureUrl }: { count: number; textureUrl: string }) {
  const buffer = useFBO();
  const { viewport } = useThree();
  const [portalScene] = useState(() => new THREE.Scene());
  const [cols, setCols] = useState(() => (typeof window !== "undefined" && window.innerWidth >= 640 ? 3 : 2));

  useEffect(() => {
    function onResize() {
      setCols(window.innerWidth >= 640 ? 3 : 2);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const rows = Math.ceil(count / cols);
  const cellW = viewport.width / cols;
  const cellH = viewport.height / rows;

  const positions = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = -viewport.width / 2 + cellW * (col + 0.5);
      const y = viewport.height / 2 - cellH * (row + 0.5);
      return [x, y, 0] as [number, number, number];
    });
  }, [count, cols, cellW, cellH, viewport.width, viewport.height]);

  useFrame(({ gl, camera }) => {
    gl.setRenderTarget(buffer);
    gl.setClearColor("#050505", 1);
    gl.render(portalScene, camera);
    gl.setRenderTarget(null);
  });

  const cardW = cellW * 0.8;
  const cardH = cellH * 0.7;

  return (
    <>
      {createPortal(
        <>
          <ambientLight intensity={0.5} />
          <pointLight position={[2, 2, 4]} intensity={40} color="#e31e24" />
          <pointLight position={[-3, -1, 3]} intensity={22} color="#f9f9f9" />
          <Backdrop textureUrl={textureUrl} />
        </>,
        portalScene
      )}
      {positions.map((pos, i) => (
        <RoundedBox key={i} args={[cardW, cardH, 0.12]} radius={0.05} smoothness={4} position={pos}>
          <MeshTransmissionMaterial
            buffer={buffer.texture}
            ior={1.15}
            thickness={0.6}
            anisotropy={0.02}
            chromaticAberration={0.05}
            roughness={0.06}
            transmission={1}
            color="#f9f9f9"
          />
        </RoundedBox>
      ))}
    </>
  );
}

// Adapted from React Bits' FluidGlass (see git history for the sphere-orb
// first pass) — same FBO/MeshTransmissionMaterial refraction core, reshaped
// into a grid of flat cards instead of one sphere, and refracting the
// section's own background photo instead of arbitrary demo content.
export function FluidGlassCards({ count, texture, className = "" }: FluidGlassCardsProps) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} gl={{ alpha: true }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <CardGrid count={count} textureUrl={texture} />
        </Suspense>
      </Canvas>
    </div>
  );
}
