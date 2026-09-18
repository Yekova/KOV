"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STUDIO_MAP_LAYOUT } from "@/config/studio/studioMapLayout";
import type { CameraState } from "@/components/studio/CameraController";

// Half-angle of the wedge. Not tied to the panorama's live FOV on purpose:
// the cone is an orientation cue, and one that changed width every time
// someone scrolled would read as a bug rather than as information.
const HALF_ANGLE = THREE.MathUtils.degToRad(30);
const RADIUS = 1.35;

// Maps the panorama's yaw onto the map's world space. StudioExperience builds
// its look direction with atan2(x, -z), so yaw 0 is -z there; a mesh with no
// rotation faces -z here too, which makes the offset zero. It is a named
// constant rather than a literal because it is the one number that would need
// changing if the plan were ever rotated relative to the panoramas, and
// because it cannot be verified without a browser.
const YAW_OFFSET = 0;

function wedgeGeometry() {
  // A flat fan on the floor, drawn from the apex outward. Built by hand
  // rather than with CircleGeometry so the arc is exactly the half-angle
  // above and no vertex sits behind the viewer.
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const a = -HALF_ANGLE + (i / steps) * HALF_ANGLE * 2;
    // Shape space is XY; the mesh is laid flat by the -90° X rotation below,
    // after which +Y here becomes -Z in the world — the direction a yaw of 0
    // faces.
    shape.lineTo(Math.sin(a) * RADIUS, Math.cos(a) * RADIUS);
  }
  shape.lineTo(0, 0);
  return new THREE.ShapeGeometry(shape);
}

// "You are here" already existed — a pulsing pin over the current room. What
// it never said is which way you are facing, which in a 360° tour is the half
// of the question that actually matters: the pin tells you the room, the cone
// tells you what is in front of you.
//
// Driven from the same ref CameraController writes every frame, so no React
// state is involved and turning in the panorama costs no re-render. The map
// runs frameloop="demand", so the only thing that must be deliberate is
// invalidating a frame when — and only when — the yaw has actually moved.
export function StudioMapViewCone({
  currentRoomId,
  cameraStateRef,
}: {
  currentRoomId: string;
  cameraStateRef?: RefObject<CameraState>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastYaw = useRef<number | null>(null);
  const { invalidate } = useThree();
  const geometry = useMemo(() => wedgeGeometry(), []);
  const layout = STUDIO_MAP_LAYOUT[currentRoomId];

  useFrame(() => {
    const mesh = meshRef.current;
    const yaw = cameraStateRef?.current?.yaw;
    if (!mesh || typeof yaw !== "number") return;
    if (lastYaw.current !== null && Math.abs(yaw - lastYaw.current) < 0.002) return;
    lastYaw.current = yaw;
    mesh.rotation.z = -(yaw + YAW_OFFSET);
    invalidate();
  });

  if (!layout || !cameraStateRef) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      // Just clear of the floor slab so it never z-fights with it.
      position={[layout.position[0], layout.position[1] + 0.03, layout.position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={2}
    >
      <meshBasicMaterial
        color="#e31e24"
        transparent
        opacity={0.22}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
