"use client";

import * as THREE from "three";
import { Suspense, useEffect, useRef, useState, type RefObject } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { useFBO, useTexture, MeshTransmissionMaterial } from "@react-three/drei";
import { easing } from "maath";

interface FluidGlassCursorProps {
  texture: string;
  className?: string;
}

// The same photo the real DOM panel shows, rendered again here purely so
// the lens has something real to refract — a flat black portal scene
// reads as an opaque dark disc, not glass. Never visible directly; it
// only ever shows up warped, through the lens.
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
// still. Position/hover come from refs fed by a window-level listener in
// the wrapper below, not R3F's own built-in pointer tracking — this
// canvas sits behind real content (see ExpertiseTeaser.tsx's stacking
// order) with pointer-events: none, so it never receives events itself.
function Lens({
  textureUrl,
  pointerRef,
  hoverRef,
}: {
  textureUrl: string;
  pointerRef: RefObject<{ x: number; y: number }>;
  hoverRef: RefObject<boolean>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const buffer = useFBO();
  const { viewport } = useThree();
  const [portalScene] = useState(() => new THREE.Scene());

  useFrame((state, delta) => {
    const { gl, camera } = state;
    const mesh = meshRef.current;
    if (mesh) {
      const destX = (pointerRef.current.x * viewport.width) / 2;
      const destY = (pointerRef.current.y * viewport.height) / 2;
      easing.damp3(mesh.position, [destX, destY, 0.4], 0.2, delta);
      const targetScale = hoverRef.current ? 1 : 0.001;
      easing.damp3(mesh.scale, [targetScale, targetScale, targetScale], 0.22, delta);
    }

    gl.setRenderTarget(buffer);
    gl.setClearColor("#050505", 1);
    gl.render(portalScene, camera);
    gl.setRenderTarget(null);
    // setClearColor is renderer-global, not scoped to the buffer render
    // above — reset to transparent or it leaks into R3F's own automatic
    // render of the main scene right after, painting the whole canvas
    // opaque and hiding whatever's stacked behind/around the lens.
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
// it's dropped into. Always `pointer-events: none` and tracks the pointer
// via a window listener + manual rect hit-testing (not DOM pointer events
// targeting this element, not R3F's built-in tracking) — so it can sit
// behind other stacked content (cards on top of it, say) without ever
// blocking clicks, selection, or its own ability to track the cursor.
export function FluidGlassCursor({ texture, className = "" }: FluidGlassCursorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const hoverRef = useRef(false);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      hoverRef.current = inside;
      if (inside) {
        pointerRef.current = {
          x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
          y: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
        };
      }
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div ref={wrapperRef} className={className} style={{ pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }} gl={{ alpha: true }} dpr={[1, 1.5]}>
        <Suspense fallback={null}>
          <Lens textureUrl={texture} pointerRef={pointerRef} hoverRef={hoverRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
