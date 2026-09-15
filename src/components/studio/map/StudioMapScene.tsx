"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { STUDIO_NODES, STUDIO_NODE_ORDER } from "@/config/studio/studioNodes";
import { STUDIO_MAP_LAYOUT, STUDIO_MAP_CENTER, STUDIO_BUILDING_BOUNDS } from "@/config/studio/studioMapLayout";
import { StudioMapRoom } from "@/components/studio/map/StudioMapRoom";
import { StudioMapBuilding } from "@/components/studio/map/StudioMapBuilding";
import { useStudioMaterials } from "@/components/studio/map/StudioMapMaterials";

// 3/4 architectural view: ~39° in plan, ~50° above the horizon.
const CAMERA_POSITION: [number, number, number] = [9, 12, 11];
const AZIMUTH_RANGE = 0.9;
const DIM_OPACITY = 0.18;
const LEVEL_FADE_MS = 450;

function boundsCorners() {
  const { min, max } = STUDIO_BUILDING_BOUNDS;
  const corners: THREE.Vector3[] = [];
  for (const x of [min[0], max[0]]) {
    for (const y of [min[1], max[1]]) {
      for (const z of [min[2], max[2]]) corners.push(new THREE.Vector3(x, y, z));
    }
  }
  return corners;
}

// fitCameraToBuilding: projects the building's bounds into camera space
// and derives the orthographic zoom that frames it with a margin, so the
// framing survives any change to the floor plan (and any canvas size)
// without hand-tuned zoom constants per mode.
function CameraRig({
  margin,
  resetToken,
  controlsRef,
}: {
  margin: number;
  resetToken: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, size, invalidate } = useThree();
  const initialised = useRef(false);

  /* eslint-disable react-hooks/immutability -- this rule doesn't model
     React Three Fiber: useThree()'s camera is a live Three.js object meant
     to be driven imperatively, and the min/max accumulators below are
     plain locals inside the callback. Per-line disables don't reliably
     match this rule's function-level analysis, hence the block form (same
     treatment as CameraController.tsx's own useFrame). */
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    if (!cam.isOrthographicCamera) return;

    if (!initialised.current || resetToken > 0) {
      cam.position.set(...CAMERA_POSITION);
      cam.lookAt(...STUDIO_MAP_CENTER);
      const controls = controlsRef.current;
      if (controls) {
        controls.target.set(...STUDIO_MAP_CENTER);
        controls.update();
      }
      initialised.current = true;
    }

    cam.updateMatrixWorld();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const corner of boundsCorners()) {
      const view = corner.clone().applyMatrix4(cam.matrixWorldInverse);
      minX = Math.min(minX, view.x);
      maxX = Math.max(maxX, view.x);
      minY = Math.min(minY, view.y);
      maxY = Math.max(maxY, view.y);
    }
    const worldWidth = Math.max(maxX - minX, 0.001);
    const worldHeight = Math.max(maxY - minY, 0.001);
    cam.zoom = Math.min(size.width / worldWidth, size.height / worldHeight) * margin;
    cam.updateProjectionMatrix();
    invalidate();
  }, [camera, size, margin, resetToken, controlsRef, invalidate]);
  /* eslint-enable react-hooks/immutability */

  return null;
}

// Selecting a room in expanded mode slides the orbit target toward it and
// nudges the zoom ~10% — once, on the transition in or out of a
// selection, so it never fights the user's own wheel zoom afterwards.
function CameraFocus({
  focusId,
  controlsRef,
}: {
  focusId: string | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, invalidate } = useThree();
  const lastFocus = useRef<string | null>(null);
  const zoomTarget = useRef<number | null>(null);

  /* eslint-disable react-hooks/immutability -- same R3F caveat as
     CameraRig above: the camera and the OrbitControls target are live
     Three.js objects driven from inside the frame loop. */
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cam = camera as THREE.OrthographicCamera;

    if (lastFocus.current !== focusId) {
      const had = Boolean(lastFocus.current);
      const has = Boolean(focusId);
      if (had !== has) zoomTarget.current = has ? cam.zoom * 1.1 : cam.zoom / 1.1;
      lastFocus.current = focusId;
    }

    const layout = focusId ? STUDIO_MAP_LAYOUT[focusId] : null;
    const [tx, ty, tz] = layout ? layout.position : STUDIO_MAP_CENTER;
    const dx = tx - controls.target.x;
    const dy = ty + 0.3 - controls.target.y;
    const dz = tz - controls.target.z;
    let changed = false;

    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 0.002) {
      controls.target.x += dx * 0.09;
      controls.target.y += dy * 0.09;
      controls.target.z += dz * 0.09;
      controls.update();
      changed = true;
    }

    if (zoomTarget.current !== null) {
      const delta = zoomTarget.current - cam.zoom;
      if (Math.abs(delta) < 0.4) {
        zoomTarget.current = null;
      } else {
        cam.zoom += delta * 0.12;
        cam.updateProjectionMatrix();
        changed = true;
      }
    }

    if (changed) invalidate();
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}

// Fades a whole level's shared materials rather than swapping colours per
// mesh — one opacity tween drives every wall, floor and prop on that
// floor at once.
function LevelDimmer({ level0Dim, level1Dim }: { level0Dim: boolean; level1Dim: boolean }) {
  const { dimGroups } = useStudioMaterials();
  const { invalidate } = useThree();
  const factors = useRef({ 0: 1, 1: 1 });

  useFrame(() => {
    let changed = false;
    ([0, 1] as const).forEach((level) => {
      const target = (level === 0 ? level0Dim : level1Dim) ? DIM_OPACITY : 1;
      const current = factors.current[level];
      if (Math.abs(current - target) < 0.004) return;
      const next = current + (target - current) * 0.16;
      factors.current[level] = next;
      dimGroups[level].forEach((material) => {
        material.opacity = (material.userData.baseOpacity ?? 1) * next;
      });
      changed = true;
    });
    if (changed) invalidate();
  });

  return null;
}

interface StudioMapSceneProps {
  currentRoomId: string;
  onHoverChange: (id: string | null) => void;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
  interactive?: boolean;
  detailed?: boolean;
  selectedLevel?: number | null;
  focusId?: string | null;
  resetToken?: number;
  margin?: number;
}

export function StudioMapScene({
  currentRoomId,
  onHoverChange,
  onSelect,
  reducedMotion,
  interactive = false,
  detailed = false,
  selectedLevel = null,
  focusId = null,
  resetToken = 0,
  margin = 0.82,
}: StudioMapSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const shadows = detailed;

  // Rooms must keep rendering their (transparent) dim material while it
  // fades back to full, otherwise returning to "Tous" pops instead of
  // fading. State is adjusted during render — React's documented pattern,
  // same idiom as GlobalOverviewMenu.tsx — with only the delayed reset
  // living in an effect.
  const targetDim0 = selectedLevel !== null && selectedLevel !== 0;
  const targetDim1 = selectedLevel !== null && selectedLevel !== 1;
  const [renderDim, setRenderDim] = useState({ level0: targetDim0, level1: targetDim1 });
  const [prevLevel, setPrevLevel] = useState(selectedLevel);
  if (prevLevel !== selectedLevel) {
    setPrevLevel(selectedLevel);
    setRenderDim({ level0: renderDim.level0 || targetDim0, level1: renderDim.level1 || targetDim1 });
  }

  useEffect(() => {
    const dim0 = selectedLevel !== null && selectedLevel !== 0;
    const dim1 = selectedLevel !== null && selectedLevel !== 1;
    const timer = setTimeout(() => setRenderDim({ level0: dim0, level1: dim1 }), LEVEL_FADE_MS);
    return () => clearTimeout(timer);
  }, [selectedLevel]);

  return (
    <>
      <OrthographicCamera makeDefault position={CAMERA_POSITION} near={0.1} far={80} />
      <CameraRig margin={margin} resetToken={resetToken} controlsRef={controlsRef} />

      {/* Three lights total: a warm key that casts the shadows, a cool
          back-fill for separation, and a low ambient so the interiors are
          never pure black. Everything else "lit" in this scene is an
          emissive material. */}
      <ambientLight intensity={0.34} color="#cfc6b8" />
      <directionalLight
        position={[7, 10, 6]}
        intensity={1.25}
        color="#fff0da"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0009}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={0.5}
        shadow-camera-far={34}
      />
      <directionalLight position={[-8, 6, -7]} intensity={0.4} color="#93a9c6" />

      <StudioMapBuilding shadows={shadows} detailed={detailed} dim0={renderDim.level0} dim1={renderDim.level1} />

      {STUDIO_NODE_ORDER.map((id) => {
        const layout = STUDIO_MAP_LAYOUT[id];
        const node = STUDIO_NODES[id];
        if (!layout || !node) return null;
        return (
          <StudioMapRoom
            key={id}
            node={node}
            layout={layout}
            isActive={id === currentRoomId}
            isSelected={id === focusId}
            onSelect={onSelect}
            onHoverChange={onHoverChange}
            reducedMotion={reducedMotion}
            detailed={detailed}
            dimmedByLevel={layout.level === 0 ? renderDim.level0 : renderDim.level1}
            shadows={shadows}
            showTooltip={!detailed}
          />
        );
      })}

      <LevelDimmer level0Dim={targetDim0} level1Dim={targetDim1} />

      {shadows && (
        <ContactShadows
          position={[0, -0.072, -0.2]}
          scale={13}
          resolution={512}
          blur={2.6}
          opacity={0.5}
          far={2.2}
          frames={1}
          color="#000000"
        />
      )}

      {interactive && (
        <>
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            enableZoom
            minZoom={30}
            maxZoom={220}
            minPolarAngle={0.55}
            maxPolarAngle={1.15}
            // Clamped so the cutaway stays readable: the tall north/west
            // walls must remain the far ones, or you end up looking at
            // the building's back and seeing nothing inside.
            minAzimuthAngle={0.686 - AZIMUTH_RANGE}
            maxAzimuthAngle={0.686 + AZIMUTH_RANGE}
          />
          <CameraFocus focusId={focusId} controlsRef={controlsRef} />
        </>
      )}
    </>
  );
}
