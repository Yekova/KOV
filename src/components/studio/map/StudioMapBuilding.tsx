"use client";

import {
  STUDIO_CORRIDOR,
  STUDIO_STAIR,
  STUDIO_COLUMNS,
  STUDIO_MAP_LAYOUT,
  LEVEL_1_HEIGHT,
} from "@/config/studio/studioMapLayout";
import { useStudioMaterials, type MaterialVariant } from "@/components/studio/map/StudioMapMaterials";
import type { StudioMapMaterialKey } from "@/config/studio/studioMapMaterials";

// Everything that belongs to the building itself rather than to one room:
// the socle it stands on, the entrance platform, the circulation spine,
// the stair core up to the terrace, the columns carrying that terrace and
// the slab it rests on. This is what turns seven volumes into one
// building — without it the rooms read as separate blocks parked next to
// each other, which is exactly how the previous pass looked.
export function StudioMapBuilding({
  shadows,
  detailed,
  dim0,
  dim1,
}: {
  shadows: boolean;
  detailed: boolean;
  /** Level-filter state, mirrored from StudioMapScene so the shell fades
   * with the floor it belongs to. */
  dim0: boolean;
  dim1: boolean;
}) {
  const { materials } = useStudioMaterials();
  const groundVariant: MaterialVariant = dim0 ? "dim0" : "full";
  const upperVariant: MaterialVariant = dim1 ? "dim1" : "full";
  const ground = (key: StudioMapMaterialKey) => materials.get(`${key}:${groundVariant}`)!;
  const upper = (key: StudioMapMaterialKey) => materials.get(`${key}:${upperVariant}`)!;

  const terrace = STUDIO_MAP_LAYOUT.p07;
  const stepRise = STUDIO_STAIR.height / STUDIO_STAIR.steps;
  const stepDepth = STUDIO_STAIR.footprint[1] / STUDIO_STAIR.steps;

  return (
    <group>
      {/* Socle: a real plinth with a bright top lip, sized just past the
          footprint rather than the oversized plane that used to make the
          building look scattered on a runway. */}
      <mesh position={[0, -0.22, -0.2]} material={materials.get("blackStone:full")!} receiveShadow={shadows}>
        <boxGeometry args={[10.2, 0.28, 10.6]} />
      </mesh>
      <mesh position={[0, -0.085, -0.2]} material={materials.get("wallTrim:full")!}>
        <boxGeometry args={[10.28, 0.014, 10.68]} />
      </mesh>

      {/* Entrance: a platform and a step in front of P01's glazed façade,
          so the way in is obvious without a label. */}
      <mesh position={[0, -0.05, 4.85]} material={ground("concrete")} receiveShadow={shadows}>
        <boxGeometry args={[3.2, 0.06, 1.2]} />
      </mesh>
      <mesh position={[0, -0.11, 5.62]} material={ground("concrete")} receiveShadow={shadows}>
        <boxGeometry args={[3.6, 0.08, 0.4]} />
      </mesh>

      {/* Circulation spine between the lobby and the design studio, with
          the gallery and lounge opening onto it. */}
      <mesh
        position={[STUDIO_CORRIDOR.position[0], -0.03, STUDIO_CORRIDOR.position[2]]}
        material={ground("corridor")}
        receiveShadow={shadows}
      >
        <boxGeometry args={[STUDIO_CORRIDOR.footprint[0], 0.06, STUDIO_CORRIDOR.footprint[1]]} />
      </mesh>

      {/* Stair core — the visible vertical link to the terrace. */}
      {Array.from({ length: STUDIO_STAIR.steps }).map((_, i) => {
        const height = (i + 1) * stepRise;
        const z = STUDIO_STAIR.position[2] + STUDIO_STAIR.footprint[1] / 2 - stepDepth / 2 - i * stepDepth;
        return (
          <mesh
            key={i}
            position={[STUDIO_STAIR.position[0], height / 2, z]}
            material={ground("concrete")}
            castShadow={shadows}
            receiveShadow={shadows}
          >
            <boxGeometry args={[STUDIO_STAIR.footprint[0] - 0.1, height, stepDepth]} />
          </mesh>
        );
      })}
      <mesh
        position={[STUDIO_STAIR.position[0] + STUDIO_STAIR.footprint[0] / 2, LEVEL_1_HEIGHT / 2, STUDIO_STAIR.position[2]]}
        material={ground("graphite")}
        castShadow={shadows}
      >
        <boxGeometry args={[0.07, LEVEL_1_HEIGHT, STUDIO_STAIR.footprint[1]]} />
      </mesh>

      {/* Columns carrying the terrace slab. */}
      {STUDIO_COLUMNS.map(([x, z], i) => (
        <mesh key={`col-${i}`} position={[x, LEVEL_1_HEIGHT / 2, z]} material={ground("concrete")} castShadow={shadows}>
          <boxGeometry args={[0.16, LEVEL_1_HEIGHT, 0.16]} />
        </mesh>
      ))}

      {/* The terrace's own slab — P07 sits on this rather than floating. */}
      <mesh
        position={[terrace.position[0], LEVEL_1_HEIGHT - 0.15, terrace.position[2]]}
        material={upper("concrete")}
        castShadow={shadows}
        receiveShadow={shadows}
      >
        <boxGeometry args={[terrace.footprint[0] + 0.2, 0.14, terrace.footprint[1] + 0.2]} />
      </mesh>

      {/* Very faint technical grid — scale reference only, expanded view
          only, well under the "no decor" line. */}
      {detailed && (
        <gridHelper
          args={[24, 24, "#2a2a2a", "#1c1c1c"]}
          position={[0, -0.37, -0.2]}
          material-transparent
          material-opacity={0.07}
        />
      )}
    </group>
  );
}
