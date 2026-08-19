"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gazeState } from "./characterGaze";

// The head/neck sit well above the world origin (see KovPlaceholder's
// local offsets below) — without an explicit look-at, the default
// camera aims at [0,0,0] and crops the head out of frame entirely.
const LOOK_AT_Y = 0.35;

function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, LOOK_AT_Y, 0);
  }, [camera]);
  return null;
}

const MAX_YAW = THREE.MathUtils.degToRad(18);
const MAX_PITCH = THREE.MathUtils.degToRad(8);

// Geometric stand-in for the real KOV character — swap for the rigged
// character-reference-sheet.glb once it exists (see docs/KOV-CHARACTER.md
// for the locked design: spherical helmet, mineral top, glossy black
// visor, small red dot, black cape/silhouette). The Spine → Neck → Head
// hierarchy and the tracking logic below are written to carry over
// unchanged onto a real skinned mesh — only this function's body changes.
function KovPlaceholder() {
  const head = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const spine = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (gazeState.reducedMotion) return;

    const override = gazeState.override;
    const targetX = override ? override.yaw : gazeState.pointerX;
    const targetY = override ? override.pitch : gazeState.pointerY;

    const targetYaw = targetX * MAX_YAW;
    const targetPitch = -targetY * MAX_PITCH;
    const idle = Math.sin(state.clock.elapsedTime * 0.6) * 0.012;

    if (head.current) {
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, targetYaw * 0.7 + idle, 6, delta);
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, targetPitch * 0.7, 6, delta);
    }
    if (neck.current) {
      neck.current.rotation.y = THREE.MathUtils.damp(neck.current.rotation.y, targetYaw * 0.28, 5, delta);
      neck.current.rotation.x = THREE.MathUtils.damp(neck.current.rotation.x, targetPitch * 0.28, 5, delta);
    }
    if (spine.current) {
      spine.current.rotation.y = THREE.MathUtils.damp(spine.current.rotation.y, targetYaw * 0.06, 3, delta);
    }
  });

  return (
    <group position={[0, -0.55, 0]}>
      <group ref={spine}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <coneGeometry args={[0.42, 1.6, 24]} />
          <meshStandardMaterial color="#0c0c0c" roughness={0.85} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.36, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#0c0c0c" roughness={0.9} metalness={0.05} />
        </mesh>

        <group ref={neck} position={[0, 1.28, 0]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.16, 0.22, 16]} />
            <meshStandardMaterial color="#0c0c0c" roughness={0.8} />
          </mesh>

          <group ref={head} position={[0, 0.36, 0]}>
            <mesh>
              <sphereGeometry args={[0.34, 32, 32]} />
              <meshStandardMaterial color="#4a4a48" roughness={0.75} metalness={0.15} />
            </mesh>
            <mesh position={[0, -0.03, 0.2]}>
              <sphereGeometry args={[0.28, 32, 32]} />
              <meshStandardMaterial color="#050505" roughness={0.12} metalness={0.6} />
            </mesh>
            <mesh position={[-0.09, -0.02, 0.46]}>
              <sphereGeometry args={[0.014, 16, 16]} />
              <meshStandardMaterial color="#e31e24" emissive="#e31e24" emissiveIntensity={0.9} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export function KovCharacterScene() {
  useEffect(() => {
    gazeState.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gazeState.finePointer = window.matchMedia("(pointer: fine)").matches;

    if (gazeState.reducedMotion || !gazeState.finePointer) return;

    function handleMove(event: PointerEvent) {
      gazeState.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      gazeState.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    }

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  return (
    <div className="w-full h-full" aria-hidden="true">
      <Canvas camera={{ position: [0, 0.55, 5.4], fov: 28 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 3, 3]} intensity={1.4} />
        <directionalLight position={[-2, -1, -2]} intensity={0.3} color="#e31e24" />
        <CameraRig />
        <KovPlaceholder />
      </Canvas>
    </div>
  );
}
