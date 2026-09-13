"use client";

import { useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Edges, Html } from "@react-three/drei";
import * as THREE from "three";
import type { StudioNode } from "@/config/studio/studioNodes";
import type { StudioMapLayoutEntry } from "@/config/studio/studioMapLayout";
import { STUDIO_MAP_PALETTE, type StudioMapMaterialKey } from "@/config/studio/studioMapMaterials";
import { STUDIO_MAP_FURNITURE, type FurnitureItem } from "@/config/studio/studioMapFurniture";

const HOVER_LIFT = 0.06;
const LIFT_SPEED = 10;
const WALL_THICKNESS = 0.19;
const WALL_CAP_THICKNESS = 0.05;
const DOOR_GAP_RATIO = 0.42;

const EDGE_ACTIVE = "#e31e24";
const EDGE_SELECTED = "#e7e5e0";
const EDGE_HOVER = "rgba(255,255,255,0.35)";

interface WallSegment {
  position: [number, number, number];
  size: [number, number, number];
  /** Which side this segment belongs to — used to place the warm accent
   * strip on the wall opposite the doorway, not a specific literal
   * segment. */
  side: "north" | "south" | "east" | "west";
}

// Real cutaway walls (with a doorway gap) instead of one solid box — this
// is the single biggest reason the old version read as a wireframe
// diagram rather than a building. "all" (the Portal's open reception)
// skips three sides entirely and keeps only a back wall.
function buildWalls(size: [number, number, number], doorSide: StudioMapLayoutEntry["doorSide"]): WallSegment[] {
  const [width, wallHeight, depth] = size;
  const hy = wallHeight / 2;

  if (doorSide === "all") {
    return [{ position: [0, hy, depth / 2], size: [width, wallHeight, WALL_THICKNESS], side: "south" }];
  }

  const segments: WallSegment[] = [];
  (["north", "south", "east", "west"] as const).forEach((side) => {
    const isNS = side === "north" || side === "south";
    const z = side === "north" ? -depth / 2 : side === "south" ? depth / 2 : 0;
    const x = side === "east" ? width / 2 : side === "west" ? -width / 2 : 0;
    const length = isNS ? width : depth;

    if (doorSide === side) {
      const gap = length * DOOR_GAP_RATIO;
      const segLength = (length - gap) / 2;
      const offset = gap / 2 + segLength / 2;
      if (isNS) {
        segments.push({ position: [-offset, hy, z], size: [segLength, wallHeight, WALL_THICKNESS], side });
        segments.push({ position: [offset, hy, z], size: [segLength, wallHeight, WALL_THICKNESS], side });
      } else {
        segments.push({ position: [x, hy, -offset], size: [WALL_THICKNESS, wallHeight, segLength], side });
        segments.push({ position: [x, hy, offset], size: [WALL_THICKNESS, wallHeight, segLength], side });
      }
    } else {
      segments.push({
        position: isNS ? [0, hy, z] : [x, hy, 0],
        size: isNS ? [width, wallHeight, WALL_THICKNESS] : [WALL_THICKNESS, wallHeight, depth],
        side,
      });
    }
  });
  return segments;
}

const OPPOSITE_SIDE = { north: "south", south: "north", east: "west", west: "east" } as const;

function materialProps(
  key: StudioMapMaterialKey,
  opacity: number,
  forceTransparent: boolean,
  emissiveBoost = 0
) {
  const spec = STUDIO_MAP_PALETTE[key];
  return {
    color: spec.color,
    roughness: spec.roughness,
    metalness: spec.metalness,
    emissive: emissiveBoost > 0 ? "#e31e24" : (spec.emissive ?? "#000000"),
    emissiveIntensity: emissiveBoost > 0 ? emissiveBoost : (spec.emissiveIntensity ?? 0),
    transparent: forceTransparent || spec.transparent || opacity < 1,
    opacity: (spec.opacity ?? 1) * opacity,
  };
}

function FurniturePiece({ item, opacity, dimmed }: { item: FurnitureItem; opacity: number; dimmed: boolean }) {
  const mat = materialProps(item.material, opacity, dimmed);
  return (
    <mesh position={item.position} rotation={[0, item.rotationY ?? 0, 0]}>
      {item.shape.kind === "box" && <boxGeometry args={item.shape.size} />}
      {item.shape.kind === "cylinder" && (
        <cylinderGeometry args={[item.shape.radiusTop, item.shape.radiusBottom, item.shape.height, 12]} />
      )}
      {item.shape.kind === "sphere" && <sphereGeometry args={[item.shape.radius, 12, 10]} />}
      <meshStandardMaterial {...mat} />
    </mesh>
  );
}

interface StudioMapRoomProps {
  node: StudioNode;
  layout: StudioMapLayoutEntry;
  /** The room actually open in the 360° engine right now. */
  isActive: boolean;
  /** The room clicked/previewed in expanded mode's info panel — distinct
   * from `isActive` (see StudioMapExpanded.tsx: clicking selects, it
   * doesn't navigate). */
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHoverChange: (id: string | null) => void;
  reducedMotion: boolean;
  /** False in mini mode: walls + floor only, no furniture — a simplified
   * LOD rather than the full detailed model, per the brief's own
   * mini-vs-expanded split. */
  detailed: boolean;
  /** True when a different level is selected in expanded mode (the level
   * selector) — dims this room without hiding it, so the two levels stay
   * spatially legible together. */
  dimmedByLevel: boolean;
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
}: StudioMapRoomProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { invalidate } = useThree();
  const baseY = layout.position[1];

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const targetY = baseY + (hovered && node.available && !reducedMotion ? HOVER_LIFT : 0);
    const dy = targetY - group.position.y;
    if (Math.abs(dy) > 0.0005) {
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

  const opacity = dimmedByLevel ? 0.28 : node.available ? 1 : 0.25;
  const walls = buildWalls(layout.size, layout.doorSide);
  const wallEdgeColor = isActive ? EDGE_ACTIVE : isSelected ? EDGE_SELECTED : hovered ? EDGE_HOVER : null;
  const furniture = detailed && node.available ? STUDIO_MAP_FURNITURE[layout.type] : [];
  // Warm accent strip sits on whichever wall faces away from the doorway
  // (the room's "back wall") — a stand-in for warm architectural
  // lighting via an emissive material rather than a real dynamic light.
  const backSide = layout.doorSide === "all" ? null : OPPOSITE_SIDE[layout.doorSide];

  return (
    <group ref={groupRef} position={[layout.position[0], layout.position[1], layout.position[2]]}>
      {/* Fake ambient occlusion — a soft, larger, darker blob beneath the
          footprint so the room reads as grounded/casting a shadow
          without a real shadow-casting light. */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[layout.size[0] * 1.35, 0.02, layout.size[2] * 1.35]} />
        <meshBasicMaterial color="#000000" transparent opacity={dimmedByLevel ? 0.08 : 0.28} />
      </mesh>

      {/* Invisible hitbox — R3F skips pointer events on non-visible
          meshes, so this uses zero opacity rather than visible=false to
          stay a real click/hover target covering the whole footprint. */}
      <mesh
        position={[0, layout.size[1] / 2, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={[layout.size[0], layout.size[1], layout.size[2]]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[layout.size[0], 0.06, layout.size[2]]} />
        <meshStandardMaterial {...materialProps(layout.floorMaterial, opacity, dimmedByLevel)} />
      </mesh>

      {isActive && (
        <>
          <mesh position={[0, 0.005, 0]}>
            <boxGeometry args={[layout.size[0] * 0.92, 0.01, layout.size[2] * 0.92]} />
            <meshStandardMaterial color="#e31e24" transparent opacity={0.16} roughness={1} metalness={0} />
          </mesh>
          <mesh position={[0, 0.004, 0]}>
            <boxGeometry args={[layout.size[0] * 1.15, 0.008, layout.size[2] * 1.15]} />
            <meshStandardMaterial color="#e31e24" transparent opacity={0.06} roughness={1} metalness={0} />
          </mesh>
        </>
      )}

      {!isActive && isSelected && (
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[layout.size[0] * 0.92, 0.01, layout.size[2] * 0.92]} />
          <meshStandardMaterial color="#e7e5e0" transparent opacity={0.1} roughness={1} metalness={0} />
        </mesh>
      )}

      {walls.map((wall, i) => (
        <mesh key={i} position={wall.position}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial {...materialProps("darkStone", opacity, dimmedByLevel, isActive ? 0.1 : 0)} />
          {wallEdgeColor && !dimmedByLevel && <Edges color={wallEdgeColor} />}
        </mesh>
      ))}

      {/* Wall-cap trim — a thin lighter strip along each wall's top edge,
          the kind of edge highlight that reads as "a real built wall"
          instead of a flat-shaded block. */}
      {!dimmedByLevel &&
        walls.map((wall, i) => (
          <mesh key={`cap-${i}`} position={[wall.position[0], wall.position[1] + wall.size[1] / 2, wall.position[2]]}>
            <boxGeometry args={[wall.size[0] + 0.03, WALL_CAP_THICKNESS, wall.size[2] + 0.03]} />
            <meshStandardMaterial {...materialProps("wallCap", opacity, false)} />
          </mesh>
        ))}

      {backSide && node.available && detailed && (
        <mesh
          position={[
            backSide === "east" ? layout.size[0] / 2 - 0.03 : backSide === "west" ? -layout.size[0] / 2 + 0.03 : 0,
            layout.size[1] - 0.08,
            backSide === "south" ? layout.size[2] / 2 - 0.03 : backSide === "north" ? -layout.size[2] / 2 + 0.03 : 0,
          ]}
        >
          <boxGeometry
            args={
              backSide === "east" || backSide === "west"
                ? [0.02, 0.05, layout.size[2] * 0.7]
                : [layout.size[0] * 0.7, 0.05, 0.02]
            }
          />
          <meshStandardMaterial {...materialProps("warmLight", opacity, false)} />
        </mesh>
      )}

      {furniture.map((item, i) => (
        <FurniturePiece key={i} item={item} opacity={opacity} dimmed={dimmedByLevel} />
      ))}

      {isActive && (
        <Html position={[0, layout.size[1] + 0.35, 0]} center zIndexRange={[6, 0]} occlude={false}>
          <div className="kov-studio-map-pin" aria-hidden="true" />
        </Html>
      )}

      {hovered && node.available && (
        <Html position={[0, layout.size[1] + 0.45, 0]} center zIndexRange={[7, 0]} occlude={false}>
          <div
            className="pointer-events-none px-3 py-2 text-center whitespace-nowrap"
            style={{
              borderRadius: 10,
              background: "rgba(6,6,6,0.92)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
            }}
          >
            <p className="text-kov-red text-[9px] font-mono tracking-widest">{node.room}</p>
            <p className="text-kov-bone text-[11px] uppercase tracking-widest mt-0.5">{node.name}</p>
            <p className="text-kov-steel text-[9px] uppercase tracking-widest mt-1">→ Explorer</p>
          </div>
        </Html>
      )}
    </group>
  );
}
