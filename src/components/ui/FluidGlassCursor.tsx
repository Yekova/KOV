"use client";

import * as THREE from "three";
import { Suspense, useRef, useState, type RefObject } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { useFBO, useTexture, MeshTransmissionMaterial } from "@react-three/drei";
import { easing } from "maath";

interface FluidGlassCursorProps {
  texture: string;
  className?: string;
}

// The same photo the real DOM panel shows, rendered again here purely so
// the lens has something real to refract — a flat black portal scene
// reads as an opaque dark disc, not glass. Never visible directly; it only
// ever shows up warped, through the lens.
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

// True to React Bits' original "lens" mode: a glass shape that chases the
// pointer (`easing.damp3`, same call the source uses) instead of sitting
// still. Visibility is driven by a DOM hover flag set on the wrapping div,
// not 3D raycasting on the mesh itself — a mesh that's continuously
// chasing the cursor makes an unreliable hover target, it can lag just
// enough mid-movement to "lose" pointer-over and flicker.
function Lens({ textureUrl, hoverRef }: { textureUrl: string; hoverRef: RefObject<boolean> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const buffer = useFBO();
  const { viewport } = useThree();
  const [portalScene] = useState(() => new THREE.Scene());

  useFrame((state, delta) => {
    const { gl, pointer, camera } = state;
    const mesh = meshRef.current;
    if (mesh) {
      const destX = (pointer.x * viewport.width) / 2;
      const destY = (pointer.y * viewport.height) / 2;
      easing.damp3(mesh.position, [destX, destY, 0.4], 0.2, delta);
      const targetScale = hoverRef.current ? 1 : 0.001;
      easing.damp3(mesh.scale, [targetScale, targetScale, targetScale], 0.22, delta);
    }

    gl.setRenderTarget(buffer);
    gl.setClearColor("#050505", 1);
    gl.render(portalScene, camera);
    gl.setRenderTarget(null);
    // `setClearColor` is a renderer-global setting, not scoped to the
    // buffer render above — reset it to transparent before R3F's own
    // automatic render of the main scene runs right after this callback,
    // or the whole canvas paints opaque and hides the real DOM (photo,
    // character, cards) behind it instead of just showing the lens.
    gl.setClearColor(0x000000, 0);
  });

  return (
    <>
      {createPortal(
        <>
          <ambientLight intensity={0.5} />
          <pointLight position={[2, 2, 4]} intensity={45} color="#e31e24" />
          <pointLight position={[-3, -1, 3]} intensity={22} color="#f9f9f9" />
          <Backdrop textureUrl={textureUrl} />
        </>,
        portalScene
      )}
      <mesh ref={meshRef} scale={0.001}>
        <sphereGeometry args={[0.9, 64, 64]} />
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={1.15}
          thickness={1.6}
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

// A refractive glass lens that follows the cursor across whatever panel
// it's dropped into, revealing a warped close-up of that panel's own
// photo as it passes over the content — adapted from React Bits'
// FluidGlass "lens" mode. `className` sizes/positions the wrapper,
// typically `absolute inset-0` over the panel it belongs to; that wrapper
// also owns pointer capture for the whole panel (a transparent canvas
// still claims its full bounding box for pointer events), so this should
// only be dropped over panels with no other interactive/selectable
// content underneath.
export function FluidGlassCursor({ texture, className = "" }: FluidGlassCursorProps) {
  const hoverRef = useRef(false);

  return (
    <div
      className={className}
      onPointerEnter={() => {
        hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} gl={{ alpha: true }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <Lens textureUrl={texture} hoverRef={hoverRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
