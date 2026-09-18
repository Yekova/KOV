"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { STUDIO_NODES, STUDIO_NODE_ORDER } from "@/config/studio/studioNodes";
import { STUDIO_MAP_LAYOUT, STUDIO_MAP_CENTER, STUDIO_BUILDING_BOUNDS } from "@/config/studio/studioMapLayout";
import { StudioMapRoom } from "@/components/studio/map/StudioMapRoom";
import { StudioMapBuilding } from "@/components/studio/map/StudioMapBuilding";
import { useStudioMaterials } from "@/components/studio/map/StudioMapMaterials";
import { StudioMapConnections } from "@/components/studio/map/StudioMapConnections";
import { StudioMapViewCone } from "@/components/studio/map/StudioMapViewCone";
import type { CameraState } from "@/components/studio/CameraController";

// 3/4 architectural view: ~39° in plan, ~50° above the horizon. Only the
// direction is fixed — the distance is solved for at runtime (CameraRig
// below), so the building frames itself whatever the canvas size.
const CAMERA_DIRECTION = new THREE.Vector3(9, 12, 11).normalize();
// A long lens, far enough back that verticals barely converge.
//
// This replaces an OrthographicCamera, and it is the single largest reason
// the map read as a floor plan rather than as a model. Parallel projection
// is the one thing the eye never sees in a real object: a scene rendered
// that way is read as a diagram however well it is lit. 28° keeps the
// near-isometric composition while giving back the small convergence that
// says "this is a thing, photographed" instead of "this is a drawing".
const CAMERA_FOV = 28;
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

// Frames the building by solving for a camera distance rather than a zoom.
//
// Each bounds corner is taken into camera space, where a corner at (x, y,
// z) is inside the frustum when |x| <= tan(hFov/2)·(-z) and likewise for
// y. Pulling the camera back by d makes z become z - d, so the distance
// this corner needs is |x|/tan(hFov/2) + z. The largest of those over all
// eight corners is the move that brings the whole building inside the
// frame; shrinking the tangents by `margin` first is what leaves a
// controlled border around it. No hand-tuned constants, and it survives
// any change to the floor plan or the canvas size.
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

  // No eslint-disable here any more: the rewritten rig drives the camera
  // through Vector3 methods rather than by assigning to its properties, so
  // react-hooks/immutability no longer has anything to object to.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;

    const target = new THREE.Vector3(...STUDIO_MAP_CENTER);
    const controls = controlsRef.current;

    // On a reset — and on first mount — return to the canonical direction.
    // On a resize, keep whatever direction the visitor has orbited to and
    // only correct the distance.
    let direction: THREE.Vector3;
    if (!initialised.current || resetToken > 0) {
      direction = CAMERA_DIRECTION.clone();
      if (controls) controls.target.copy(target);
      initialised.current = true;
    } else {
      direction = cam.position.clone().sub(controls ? controls.target : target);
      if (direction.lengthSq() < 1e-6) direction = CAMERA_DIRECTION.clone();
      direction.normalize();
    }

    cam.position.copy(target).addScaledVector(direction, 1);
    cam.lookAt(target);
    cam.updateMatrixWorld();

    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * margin;
    const tanH = tanV * (size.width / Math.max(size.height, 1));

    let needed = 0;
    for (const corner of boundsCorners()) {
      const view = corner.clone().applyMatrix4(cam.matrixWorldInverse);
      needed = Math.max(needed, Math.abs(view.x) / tanH + view.z, Math.abs(view.y) / tanV + view.z);
    }

    const distance = Math.max(needed + 1, 1);
    cam.position.copy(target).addScaledVector(direction, distance);
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    controls?.update();
    invalidate();
  }, [camera, size, margin, resetToken, controlsRef, invalidate]);

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
    // `zoom` exists on a perspective camera too and scales its projection
    // independently of distance — which is exactly what's wanted here: the
    // nudge can't fight the wheel, because the wheel now moves the camera.
    const cam = camera as THREE.PerspectiveCamera;

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
  /** Which room the pointer is currently over, so the arc leading to it can
   * be emphasised. Owned by the parent because the tooltip and side panel
   * need it too. */
  hoveredId?: string | null;
  /** The panorama's live camera state. Drives the view cone; absent in any
   * context where the map is shown without a tour running behind it. */
  cameraStateRef?: RefObject<CameraState>;
  /** Rooms the visitor has already been in. */
  visitedIds?: ReadonlySet<string>;
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
  hoveredId = null,
  cameraStateRef,
  visitedIds,
  // Fraction of the frame the building is fitted inside. Raised from
  // 0.82: the model was sitting small in a lot of empty black, which the
  // brief called out. These put it at roughly 85% of the expanded canvas
  // and near the full width of the 280px HUD one.
  margin = 0.9,
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
      <PerspectiveCamera makeDefault fov={CAMERA_FOV} near={0.5} far={200} position={[15.5, 20.6, 18.9]} />
      <CameraRig margin={margin} resetToken={resetToken} controlsRef={controlsRef} />

      {/* A hierarchy rather than a pile of lamps: an environment that the
          materials can reflect, one key that casts every shadow, and a
          single cool bounce for separation.

          The environment is built from Lightformers, not an HDRI — four
          emissive planes rendered once into a cube target (frames={1},
          and the scene is frameloop="demand" anyway). That gets real
          area-light falloff and something for the metal and glass to
          catch, with no image to fetch and no visible background. Only in
          the expanded view: the 280px HUD map cannot show a reflection. */}
      {detailed && (
        <Environment frames={1} resolution={128}>
          <Lightformer intensity={1.6} color="#fff1dd" position={[6, 8, 4]} scale={[9, 9, 1]} target={[0, 0, 0]} />
          <Lightformer intensity={0.8} color="#cfe0f2" position={[-7, 5, -5]} scale={[7, 7, 1]} target={[0, 0, 0]} />
          <Lightformer intensity={0.45} color="#9aa7b4" position={[0, -6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 14, 1]} />
          <Lightformer intensity={0.35} color="#ffd9b0" position={[0, 2, 9]} scale={[10, 4, 1]} target={[0, 0, 0]} />
        </Environment>
      )}

      <ambientLight intensity={detailed ? 0.42 : 0.85} color="#d8d1c4" />
      <hemisphereLight args={["#cfe0f2", "#463b2c", detailed ? 0.3 : 0.55]} />
      <directionalLight
        position={[7, 10, 6]}
        intensity={1.95}
        color="#fff3e2"
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
      <directionalLight position={[-8, 6, -7]} intensity={0.75} color="#a8bcd6" />

      {/* The ground the model stands on. Not pure black on purpose: a
          shadow cast onto #000 is invisible, so the key light's work
          simply disappeared. At #080808 it reads, and the model stops
          floating in a void. */}
      {detailed && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.24, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#080808" roughness={0.94} metalness={0.04} />
        </mesh>
      )}

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
            visited={visitedIds?.has(id) ?? false}
          />
        );
      })}

      {/* Drawn after the rooms so the arcs and the cone read as an overlay
          on the model rather than as parts of it. */}
      <StudioMapConnections currentRoomId={currentRoomId} hoveredId={hoveredId} />
      <StudioMapViewCone currentRoomId={currentRoomId} cameraStateRef={cameraStateRef} />

      <LevelDimmer level0Dim={targetDim0} level1Dim={targetDim1} />

      {shadows && (
        <ContactShadows
          position={[0, -0.072, -0.2]}
          scale={13}
          resolution={512}
          blur={2.6}
          opacity={0.38}
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
            // Distance, not zoom: a perspective camera dollies. Bounded to
            // roughly the building's own radius at the near end so you
            // can't push the lens through a wall, and to a few times it at
            // the far end so it can't be lost in the dark.
            minDistance={9}
            maxDistance={46}
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
