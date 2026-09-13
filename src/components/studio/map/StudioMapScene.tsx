"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls, Line } from "@react-three/drei";
import { STUDIO_NODES, STUDIO_NODE_ORDER } from "@/config/studio/studioNodes";
import { STUDIO_MAP_LAYOUT, STUDIO_MAP_CENTER } from "@/config/studio/studioMapLayout";
import { StudioMapRoom } from "@/components/studio/map/StudioMapRoom";

const CAMERA_POSITION: [number, number, number] = [7, 8, 10];

function CameraAim({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
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
  zoom?: number;
}

// Shared scene content between the mini HUD card and the expanded modal —
// only the camera zoom and whether OrbitControls is mounted differ.
// Simple boxes + lines + two lights, no postprocessing/shadows/HDRI, per
// the brief's own performance constraints — this shares the page with the
// full panorama engine and must not compete with it for GPU budget.
export function StudioMapScene({
  currentRoomId,
  onHoverChange,
  onSelect,
  reducedMotion,
  interactive = false,
  zoom = 55,
}: StudioMapSceneProps) {
  const pairs = useConnectionPairs();

  return (
    <>
      <OrthographicCamera makeDefault position={CAMERA_POSITION} zoom={zoom} near={0.1} far={100} />
      <CameraAim target={STUDIO_MAP_CENTER} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 4]} intensity={0.85} />

      {/* Thin base platform tying the volumes together visually — not a
          real floor, just enough to read as "one building" rather than
          boxes floating in a void. */}
      <mesh position={[0, -0.25, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11, 10]} />
        <meshBasicMaterial color="#080808" transparent opacity={0.55} />
      </mesh>

      {pairs.map(({ a, b }) => {
        const posA = STUDIO_MAP_LAYOUT[a].position;
        const posB = STUDIO_MAP_LAYOUT[b].position;
        const involvesCurrent = a === currentRoomId || b === currentRoomId;
        return (
          <Line
            key={`${a}-${b}`}
            points={[posA, posB]}
            color={involvesCurrent ? "#7a2226" : "#2a2a2a"}
            lineWidth={involvesCurrent ? 2.2 : 1.4}
          />
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
            onSelect={onSelect}
            onHoverChange={onHoverChange}
            reducedMotion={reducedMotion}
          />
        );
      })}

      {interactive && (
        <OrbitControls
          makeDefault
          target={STUDIO_MAP_CENTER}
          enablePan={false}
          enableZoom
          minZoom={35}
          maxZoom={130}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.3}
        />
      )}
    </>
  );
}
