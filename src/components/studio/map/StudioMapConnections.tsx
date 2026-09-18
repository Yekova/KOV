"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { STUDIO_NODES } from "@/config/studio/studioNodes";
import { STUDIO_MAP_LAYOUT } from "@/config/studio/studioMapLayout";

const RED = "#e31e24";
const SEGMENTS = 36;

// A quadratic arc rather than a line drawn on the floor.
//
// A floor-level route would be the more literal drawing, but it would have to
// be pathfound through the corridor and would clip through every wall it
// crossed — and the point here is not to survey the circulation, it is to
// answer "where can I go from here". An arc that hops over the roofline reads
// unambiguously as a link laid over the model, never as a piece of it, and it
// stays legible from any azimuth the controls allow.
function arcPoints(from: THREE.Vector3, to: THREE.Vector3) {
  const span = from.distanceTo(to);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  // Taller for longer hops, so a link across the building doesn't read as
  // flat while a neighbouring one arches.
  mid.y += 0.85 + span * 0.22;

  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= SEGMENTS; i += 1) {
    const t = i / SEGMENTS;
    const inv = 1 - t;
    points.push(
      new THREE.Vector3()
        .addScaledVector(from, inv * inv)
        .addScaledVector(mid, 2 * inv * t)
        .addScaledVector(to, t * t)
    );
  }
  return points;
}

// The circulation graph, drawn.
//
// STUDIO_NODES has carried a real `connections` array all along — which rooms
// actually open onto which — and the map never showed it. It appeared only as
// text chips ("Accessible depuis P01") in the expanded view's side panel, so
// the model told you what the building looks like and nothing about where you
// could go, which is the one thing a navigation map exists for.
//
// Only the links leaving the room you are currently in are drawn. Every link
// in the graph at once would be a diagram of the building; this is a diagram
// of your options.
export function StudioMapConnections({
  currentRoomId,
  hoveredId,
  visible = true,
}: {
  currentRoomId: string;
  hoveredId?: string | null;
  visible?: boolean;
}) {
  const links = useMemo(() => {
    const from = STUDIO_MAP_LAYOUT[currentRoomId];
    const node = STUDIO_NODES[currentRoomId];
    if (!from || !node) return [];

    const origin = new THREE.Vector3(from.position[0], from.position[1] + 0.2, from.position[2]);

    return node.connections
      .map((connection) => {
        const target = STUDIO_MAP_LAYOUT[connection.targetNodeId];
        const targetNode = STUDIO_NODES[connection.targetNodeId];
        // A link to a room that isn't built yet would be a promise the map
        // can't keep — those rooms are already rendered as unavailable.
        if (!target || !targetNode?.available) return null;
        const end = new THREE.Vector3(target.position[0], target.position[1] + 0.2, target.position[2]);
        return { id: connection.targetNodeId, points: arcPoints(origin, end), end };
      })
      .filter((link): link is NonNullable<typeof link> => link !== null);
  }, [currentRoomId]);

  if (!visible || links.length === 0) return null;

  return (
    <group>
      {links.map((link) => {
        const emphasised = link.id === hoveredId;
        return (
          <group key={link.id}>
            <Line
              points={link.points}
              color={RED}
              lineWidth={emphasised ? 2.2 : 1.3}
              transparent
              opacity={emphasised ? 0.95 : 0.45}
              // Dashed reads as "a route you could take" rather than as a
              // built element of the model — the same distinction a floor
              // plan makes between a wall and a sightline.
              dashed
              dashSize={0.26}
              gapSize={0.2}
            />
            {/* A node where the arc lands, so the eye finds the destination
                without having to trace the whole curve. */}
            <mesh position={link.end}>
              <sphereGeometry args={[emphasised ? 0.11 : 0.075, 12, 12]} />
              <meshBasicMaterial color={RED} transparent opacity={emphasised ? 1 : 0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
