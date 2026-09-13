"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { STUDIO_NODES, STUDIO_NODE_ORDER } from "@/config/studio/studioNodes";
import { STUDIO_MAP_LAYOUT, STUDIO_MAP_CENTER } from "@/config/studio/studioMapLayout";
import { STUDIO_MAP_PALETTE } from "@/config/studio/studioMapMaterials";
import { StudioMapRoom } from "@/components/studio/map/StudioMapRoom";

const CAMERA_POSITION: [number, number, number] = [9, 10, 11];

function CameraAim({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

// Clicking a room in expanded mode (see StudioMapExpanded.tsx) selects it
// rather than navigating immediately — this is the "camera recenters
// slightly" half of that: a gentle useFrame lerp of OrbitControls' own
// target toward the selected room (or back to the building's center once
// nothing's selected), not a framer-motion tween — simpler to keep inside
// the render loop it already shares with everything else here.
function CameraFocus({
  focusId,
  controlsRef,
}: {
  focusId: string | null;
  controlsRef: RefObject<OrbitControlsImpl | null>;
}) {
  const { invalidate } = useThree();
  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const [tx, ty, tz] = focusId && STUDIO_MAP_LAYOUT[focusId] ? STUDIO_MAP_LAYOUT[focusId].position : STUDIO_MAP_CENTER;
    const dx = tx - controls.target.x;
    const dy = ty - controls.target.y;
    const dz = tz - controls.target.z;
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) < 0.002) return;
    controls.target.x += dx * 0.08;
    controls.target.y += dy * 0.08;
    controls.target.z += dz * 0.08;
    controls.update();
    invalidate();
  });
  return null;
}

// Every unordered {a,b} pair with a real connection in STUDIO_NODES *and*
// a layout entry for both ends — computed from the same data every other
// Studio nav UI already reads, not a second hand-authored connection
// list.
function useConnectionPairs() {
  return useMemo(() => {
    const seen = new Set<string>();
    const pairs: Array<{ a: string; b: string }> = [];
    for (const id of STUDIO_NODE_ORDER) {
      const node = STUDIO_NODES[id];
      if (!node || !STUDIO_MAP_LAYOUT[id]) continue;
      for (const connection of node.connections) {
        const targetId = connection.targetNodeId;
        if (!STUDIO_MAP_LAYOUT[targetId]) continue;
        const key = [id, targetId].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({ a: id, b: targetId });
      }
    }
    return pairs;
  }, []);
}

interface StudioMapSceneProps {
  currentRoomId: string;
  onHoverChange: (id: string | null) => void;
  onSelect: (id: string) => void;
  reducedMotion: boolean;
  /** Expanded mode only — mini mode keeps the camera fixed. */
  interactive?: boolean;
  /** Furniture/detail LOD — off in the mini HUD card. */
  detailed?: boolean;
  /** Level filter (expanded mode's level selector) — rooms on any other
   * level dim rather than disappear, so both levels stay legible
   * together. null shows every level at full opacity. */
  selectedLevel?: number | null;
  /** Selected room in expanded mode — nudges the OrbitControls target
   * toward it (see CameraFocus above). Ignored when `interactive` is
   * false (mini mode has no OrbitControls to nudge). */
  focusId?: string | null;
  zoom?: number;
}

// Shared scene content between the mini HUD card and the expanded modal —
// only zoom/interactive/detailed differ. Simple boxes + lines, no
// postprocessing/shadows/HDRI, per the brief's own performance
// constraints — this shares the page with the full panorama engine and
// must not compete with it for GPU budget.
export function StudioMapScene({
  currentRoomId,
  onHoverChange,
  onSelect,
  reducedMotion,
  interactive = false,
  detailed = false,
  selectedLevel = null,
  focusId = null,
  zoom = 55,
}: StudioMapSceneProps) {
  const pairs = useConnectionPairs();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <>
      <OrthographicCamera makeDefault position={CAMERA_POSITION} zoom={zoom} near={0.1} far={100} />
      <CameraAim target={STUDIO_MAP_CENTER} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={0.9} />

      {/* Two-tier plinth — a wider dark base plus a slightly raised,
          lighter-edged deck the rooms actually sit on. A single flat
          plane read as "boxes floating over a void"; a real (if very
          simple) two-level base reads as an actual maquette pedestal. */}
      <mesh position={[0, -0.34, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 11]} />
        <meshBasicMaterial color="#050505" transparent opacity={0.6} />
      </mesh>
      <mesh position={[0, -0.28, 0.4]}>
        <boxGeometry args={[10.4, 0.1, 9.4]} />
        <meshStandardMaterial color="#100f0c" roughness={0.9} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.225, 0.4]}>
        <boxGeometry args={[10.42, 0.01, 9.42]} />
        <meshStandardMaterial {...{ color: STUDIO_MAP_PALETTE.wallCap.color, roughness: 0.5, metalness: 0.3 }} />
      </mesh>

      {pairs.map(({ a, b }) => {
        const layoutA = STUDIO_MAP_LAYOUT[a];
        const layoutB = STUDIO_MAP_LAYOUT[b];
        const involvesCurrent = a === currentRoomId || b === currentRoomId;
        const sameLevel = layoutA.level === layoutB.level;

        if (sameLevel) {
          // A real flat corridor strip at floor level, not just a thin
          // line floating in space — reads as circulation between two
          // rooms on the same floor.
          const [ax, , az] = layoutA.position;
          const [bx, , bz] = layoutB.position;
          const dx = bx - ax;
          const dz = bz - az;
          const length = Math.hypot(dx, dz);
          const angle = Math.atan2(dx, dz);
          const midX = (ax + bx) / 2;
          const midZ = (az + bz) / 2;
          const color = involvesCurrent ? "#5c1d20" : STUDIO_MAP_PALETTE.corridor.color;
          return (
            <mesh key={`${a}-${b}`} position={[midX, -0.02, midZ]} rotation={[-Math.PI / 2, 0, angle]}>
              <planeGeometry args={[0.5, length]} />
              <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
            </mesh>
          );
        }

        // Cross-level (Portal ↔ Rooftop): a simplified stair/lift core —
        // a slim rising shaft plus a few stacked step slabs — rather than
        // just a line floating between two floors.
        const [ax, ay, az] = layoutA.position;
        const [bx, by, bz] = layoutB.position;
        const midX = (ax + bx) / 2;
        const midZ = (az + bz) / 2;
        const bottomY = Math.min(ay, by);
        const topY = Math.max(ay, by);
        const riserColor = involvesCurrent ? "#5c1d20" : STUDIO_MAP_PALETTE.darkStone.color;
        const stepCount = 4;
        return (
          <group key={`${a}-${b}`}>
            <mesh position={[midX, (bottomY + topY) / 2, midZ]}>
              <boxGeometry args={[0.4, topY - bottomY, 0.4]} />
              <meshStandardMaterial color={riserColor} roughness={0.75} metalness={0.1} />
            </mesh>
            {Array.from({ length: stepCount }).map((_, i) => {
              const t = (i + 1) / (stepCount + 1);
              return (
                <mesh key={i} position={[midX, bottomY + (topY - bottomY) * t, midZ]}>
                  <boxGeometry args={[0.5, 0.03, 0.5]} />
                  <meshStandardMaterial {...{ color: STUDIO_MAP_PALETTE.wallCap.color, roughness: 0.5, metalness: 0.25 }} />
                </mesh>
              );
            })}
          </group>
        );
      })}

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
            dimmedByLevel={selectedLevel !== null && layout.level !== selectedLevel}
          />
        );
      })}

      {interactive && (
        <>
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={STUDIO_MAP_CENTER}
            enablePan={false}
            enableZoom
            minZoom={35}
            maxZoom={130}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.3}
          />
          <CameraFocus focusId={focusId} controlsRef={controlsRef} />
        </>
      )}
    </>
  );
}
