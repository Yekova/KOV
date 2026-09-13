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
const WALL_THICKNESS = 0.15;
const DOOR_GAP_RATIO = 0.42;

const EDGE_ACTIVE = "#e31e24";
const EDGE_HOVER = "rgba(255,255,255,0.35)";

interface WallSegment {
  position: [number, number, number];
  size: [number, number, number];
}

// Real cutaway walls (with a doorway gap) instead of one solid box — this
// is the single biggest reason the old version read as a wireframe
// diagram rather than a building. "all" (the Portal's open reception)
// skips three sides entirely and keeps only a back wall.
function buildWalls(size: [number, number, number], doorSide: StudioMapLayoutEntry["doorSide"]): WallSegment[] {
  const [width, wallHeight, depth] = size;
  const hy = wallHeight / 2;

  if (doorSide === "all") {
    return [{ position: [0, hy, depth / 2], size: [width, wallHeight, WALL_THICKNESS] }];
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
        segments.push({ position: [-offset, hy, z], size: [segLength, wallHeight, WALL_THICKNESS] });
        segments.push({ position: [offset, hy, z], size: [segLength, wallHeight, WALL_THICKNESS] });
      } else {
        segments.push({ position: [x, hy, -offset], size: [WALL_THICKNESS, wallHeight, segLength] });
        segments.push({ position: [x, hy, offset], size: [WALL_THICKNESS, wallHeight, segLength] });
      }
    } else {
      segments.push({
        position: isNS ? [0, hy, z] : [x, hy, 0],
        size: isNS ? [width, wallHeight, WALL_THICKNESS] : [WALL_THICKNESS, wallHeight, depth],
      });
    }
  });
  return segments;
}

function materialProps(key: StudioMapMaterialKey, opacity: number, forceTransparent: boolean) {
  const spec = STUDIO_MAP_PALETTE[key];
  return {
    color: spec.color,
    roughness: spec.roughness,
    metalness: spec.metalness,
    emissive: spec.emissive ?? "#000000",
    emissiveIntensity: spec.emissiveIntensity ?? 0,
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
  isActive: boolean;
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
  const wallEdgeColor = isActive ? EDGE_ACTIVE : hovered ? EDGE_HOVER : null;
  const furniture = detailed && node.available ? STUDIO_MAP_FURNITURE[layout.type] : [];

  return (
    <group ref={groupRef} position={[layout.position[0], layout.position[1], layout.position[2]]}>
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
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[layout.size[0] * 0.92, 0.01, layout.size[2] * 0.92]} />
          <meshStandardMaterial color="#e31e24" transparent opacity={0.22} roughness={1} metalness={0} />
        </mesh>
      )}

      {walls.map((wall, i) => (
        <mesh key={i} position={wall.position}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial {...materialProps("darkStone", opacity, dimmedByLevel)} />
          {wallEdgeColor && !dimmedByLevel && <Edges color={wallEdgeColor} />}
        </mesh>
      ))}

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
