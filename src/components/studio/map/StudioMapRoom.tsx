"use client";

import { useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { StudioNode } from "@/config/studio/studioNodes";
import { STUDIO_BUILDING_BOUNDS, type StudioMapLayoutEntry, type WallSide } from "@/config/studio/studioMapLayout";
import type { StudioMapMaterialKey } from "@/config/studio/studioMapMaterials";
import { STUDIO_MAP_FURNITURE, type FurnitureItem } from "@/config/studio/studioMapFurniture";
import { useStudioMaterials, type MaterialVariant } from "@/components/studio/map/StudioMapMaterials";

const HOVER_LIFT = 0.05;
const LIFT_SPEED = 10;
const FLOOR_THICKNESS = 0.08;

interface WallPiece {
  position: [number, number, number];
  size: [number, number, number];
  glass: boolean;
}

// A side is exterior when the room's own edge sits on the building's
// outer boundary — derived from the plan rather than hand-flagged, so it
// stays correct if the floor plan moves.
function isExteriorSide(side: WallSide, entry: StudioMapLayoutEntry) {
  const [x, , z] = entry.position;
  const [width, depth] = entry.footprint;
  const { min, max } = STUDIO_BUILDING_BOUNDS;
  const eps = 0.01;
  if (side === "north") return Math.abs(z - depth / 2 - min[2]) < eps;
  if (side === "south") return Math.abs(z + depth / 2 - max[2]) < eps;
  if (side === "west") return Math.abs(x - width / 2 - min[0]) < eps;
  return Math.abs(x + width / 2 - max[0]) < eps;
}

// The cutaway rule: the building keeps a real façade along its far
// (north/west) outer edges, and everything else — near façades and every
// interior partition — is cut low so the whole interior stays visible.
// The camera sits off the +X/+Z corner and its azimuth is clamped (see
// StudioMapScene), which is what makes "far" well-defined here.
function heightForSide(side: WallSide, entry: StudioMapLayoutEntry) {
  const { cutHeight, backHeight } = entry.architecture;
  const isFar = side === "north" || side === "west";
  return isFar && isExteriorSide(side, entry) ? backHeight : cutHeight;
}

// Walls are inset so their outer face is flush with the footprint edge.
// Two neighbouring rooms then produce two parallel partitions instead of
// two coincident slabs fighting over the same depth buffer.
function buildWalls(entry: StudioMapLayoutEntry): WallPiece[] {
  const [width, depth] = entry.footprint;
  const { wallThickness: t, openings, windows, openSides = [], parapet } = entry.architecture;
  const pieces: WallPiece[] = [];
  const sides: WallSide[] = ["north", "south", "east", "west"];

  for (const side of sides) {
    if (openSides.includes(side) && !parapet) continue;

    const alongX = side === "north" || side === "south";
    const length = alongX ? width : depth;
    const height = parapet ?? heightForSide(side, entry);
    const fixed =
      side === "north" ? -depth / 2 + t / 2 : side === "south" ? depth / 2 - t / 2 : side === "east" ? width / 2 - t / 2 : -width / 2 + t / 2;

    const features = parapet
      ? []
      : [
          ...openings.filter((o) => o.side === side).map((o) => ({ ...o, sill: 0, isWindow: false })),
          ...windows.filter((w) => w.side === side).map((w) => ({ ...w, isWindow: true })),
        ].sort((a, b) => a.offset - a.width / 2 - (b.offset - b.width / 2));

    const push = (start: number, end: number, yBottom: number, yTop: number, glass: boolean) => {
      const segLength = end - start;
      if (segLength <= 0.001 || yTop - yBottom <= 0.001) return;
      const u = (start + end) / 2;
      const y = (yBottom + yTop) / 2;
      const h = yTop - yBottom;
      pieces.push({
        position: alongX ? [u, y, fixed] : [fixed, y, u],
        size: alongX ? [segLength, h, t] : [t, h, segLength],
        glass,
      });
    };

    let cursor = -length / 2;
    for (const feature of features) {
      const start = feature.offset - feature.width / 2;
      const end = feature.offset + feature.width / 2;
      push(cursor, Math.min(start, length / 2), 0, height, false);
      if (feature.isWindow) {
        push(Math.max(start, -length / 2), Math.min(end, length / 2), 0, feature.sill, false);
        push(Math.max(start, -length / 2), Math.min(end, length / 2), feature.sill, height, true);
      }
      cursor = Math.max(cursor, end);
    }
    push(cursor, length / 2, 0, height, false);
  }

  return pieces;
}

// Faked interior lighting: emissive cove strips near the top of the
// walls rather than real point lights (a dozen dynamic lights would cost
// far more than this map's budget allows, for a similar read).
function lightStrips(entry: StudioMapLayoutEntry, active: boolean): Array<{ position: [number, number, number]; size: [number, number, number]; material: StudioMapMaterialKey }> {
  const [width, depth] = entry.footprint;
  const y = entry.architecture.cutHeight - 0.09;
  const warm = entry.lighting === "warm" || entry.lighting === "accent";
  const key: StudioMapMaterialKey = active ? "kovRed" : warm ? "warmEmissive" : "coolEmissive";

  switch (entry.lighting) {
    case "warm":
    case "neutral":
      return [
        { position: [0, y, -depth / 2 + 0.22], size: [width * 0.66, 0.035, 0.05], material: key },
        { position: [0, y, depth / 2 - 0.22], size: [width * 0.66, 0.035, 0.05], material: key },
      ];
    case "accent":
      return [{ position: [0, y, 0], size: [0.05, 0.035, depth * 0.6], material: key }];
    case "dim":
      return [{ position: [0, y, depth / 2 - 0.25], size: [width * 0.5, 0.03, 0.04], material: key }];
    default:
      return [];
  }
}

function FurniturePiece({ item, material, shadows }: { item: FurnitureItem; material: THREE.Material; shadows: boolean }) {
  return (
    <mesh
      position={item.position}
      rotation={[0, item.rotationY ?? 0, 0]}
      material={material}
      castShadow={shadows}
      receiveShadow={shadows}
    >
      {item.shape.kind === "box" && <boxGeometry args={item.shape.size} />}
      {item.shape.kind === "cylinder" && (
        <cylinderGeometry args={[item.shape.radiusTop, item.shape.radiusBottom, item.shape.height, 10]} />
      )}
      {item.shape.kind === "sphere" && <sphereGeometry args={[item.shape.radius, 10, 8]} />}
    </mesh>
  );
}

interface StudioMapRoomProps {
  node: StudioNode;
  layout: StudioMapLayoutEntry;
  /** The room actually open in the 360° engine right now. */
  isActive: boolean;
  /** The room previewed in expanded mode's panel — clicking selects, it
   * doesn't navigate, so this is deliberately distinct from isActive. */
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHoverChange: (id: string | null) => void;
  reducedMotion: boolean;
  detailed: boolean;
  dimmedByLevel: boolean;
  shadows: boolean;
  /** Mini mode only: expanded mode has real labels, so showing a hover
   * tooltip there duplicated the room name on screen. */
  showTooltip: boolean;
  /** The visitor has already been in this room. On a seven-room tour it is
   * the thing you open a map to find out. */
  visited: boolean;
}

export function StudioMapRoom({
  node,
  layout,
  isActive,
  isSelected,
  onSelect,
  onHoverChange,
  reducedMotion,
  detailed,
  dimmedByLevel,
  shadows,
  showTooltip,
  visited,
}: StudioMapRoomProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { invalidate } = useThree();
  const { materials } = useStudioMaterials();
  const baseY = layout.position[1];

  const variant: MaterialVariant = !node.available
    ? "faint"
    : dimmedByLevel
      ? layout.level === 0
        ? "dim0"
        : "dim1"
      : "full";
  const mat = (key: StudioMapMaterialKey) => materials.get(`${key}:${variant}`)!;

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const targetY = baseY + (hovered && node.available && !reducedMotion ? HOVER_LIFT : 0);
    const dy = targetY - group.position.y;
    if (Math.abs(dy) > 0.0004) {
      group.position.y += dy * Math.min(1, LIFT_SPEED * (1 / 60));
      invalidate();
    } else if (group.position.y !== targetY) {
      group.position.y = targetY;
      invalidate();
    }
  });

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    if (!node.available) return;
    setHovered(true);
    onHoverChange(node.id);
    invalidate();
  }

  function handlePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHovered(false);
    onHoverChange(null);
    invalidate();
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (!node.available) return;
    onSelect(node.id);
  }

  const [width, depth] = layout.footprint;
  const walls = buildWalls(layout);
  // Anchor the pin/tooltip just above whatever this room's tallest wall
  // actually is, rather than at a fixed height that leaves them floating
  // over the low-walled rooms.
  const topOfRoom = walls.reduce((max, wall) => Math.max(max, wall.position[1] + wall.size[1] / 2), 0.4);
  const strips = node.available ? lightStrips(layout, isActive) : [];
  const furniture = node.available ? STUDIO_MAP_FURNITURE[layout.type].filter((item) => detailed || item.mini) : [];
  const hitHeight = Math.max(layout.architecture.backHeight, 0.4);

  // A thin traced outline at floor level, not a red slab over the whole
  // room — the furniture has to stay readable underneath.
  const outlineKey: StudioMapMaterialKey | null = isActive ? "kovRed" : isSelected ? "wallTrim" : hovered ? "wallTrim" : null;

  return (
    <group ref={groupRef} position={[layout.position[0], layout.position[1], layout.position[2]]}>
      <mesh
        position={[0, hitHeight / 2, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[width, hitHeight, depth]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh position={[0, -FLOOR_THICKNESS / 2, 0]} material={mat(layout.floorMaterial)} receiveShadow={shadows}>
        <boxGeometry args={[width, FLOOR_THICKNESS, depth]} />
      </mesh>

      {outlineKey && (
        <group position={[0, 0.012, 0]}>
          <mesh position={[0, 0, -depth / 2 + 0.03]} material={mat(outlineKey)}>
            <boxGeometry args={[width, 0.022, 0.05]} />
          </mesh>
          <mesh position={[0, 0, depth / 2 - 0.03]} material={mat(outlineKey)}>
            <boxGeometry args={[width, 0.022, 0.05]} />
          </mesh>
          <mesh position={[-width / 2 + 0.03, 0, 0]} material={mat(outlineKey)}>
            <boxGeometry args={[0.05, 0.022, depth]} />
          </mesh>
          <mesh position={[width / 2 - 0.03, 0, 0]} material={mat(outlineKey)}>
            <boxGeometry args={[0.05, 0.022, depth]} />
          </mesh>
        </group>
      )}

      {walls.map((wall, i) => (
        <mesh
          key={i}
          position={wall.position}
          material={mat(wall.glass ? "smokedGlass" : "darkStone")}
          castShadow={shadows && !wall.glass}
          receiveShadow={shadows && !wall.glass}
        >
          <boxGeometry args={wall.size} />
        </mesh>
      ))}

      {strips.map((strip, i) => (
        <mesh key={`led-${i}`} position={strip.position} material={mat(strip.material)}>
          <boxGeometry args={strip.size} />
        </mesh>
      ))}

      {furniture.map((item, i) => (
        <FurniturePiece key={`f-${i}`} item={item} material={mat(item.material)} shadows={shadows} />
      ))}

      {isActive && (
        <Html position={[0, topOfRoom + 0.28, 0]} center zIndexRange={[6, 0]} occlude={false}>
          <div className="kov-studio-map-pin" aria-hidden="true" />
        </Html>
      )}

      {/* Already seen. Deliberately a mark on the floor rather than a badge
          over the roof: the roofline is where the active pin and the labels
          live, and a third floating element up there would turn the model
          into a pincushion. Not drawn on the active room — you are in it. */}
      {visited && !isActive && node.available && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
          <ringGeometry args={[0.2, 0.26, 24]} />
          <meshBasicMaterial color="#e7e7e5" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      )}

      {showTooltip && hovered && node.available && (
        <Html position={[0, topOfRoom + 0.4, 0]} center zIndexRange={[7, 0]} occlude={false}>
          <div
            className="pointer-events-none px-2.5 py-1.5 text-center whitespace-nowrap"
            style={{
              borderRadius: 8,
              background: "rgba(6,6,6,0.92)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <p className="text-kov-red text-[9px] font-mono tracking-widest">{node.room}</p>
            <p className="text-kov-bone text-[10px] uppercase tracking-widest mt-0.5">{node.name}</p>
          </div>
        </Html>
      )}
    </group>
  );
}
