"use client";

import { useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Edges, Html } from "@react-three/drei";
import * as THREE from "three";
import type { StudioNode } from "@/config/studio/studioNodes";
import type { StudioMapLayoutEntry } from "@/config/studio/studioMapLayout";

const HOVER_LIFT = 0.08;
const LIFT_SPEED = 10;

const COLOR_DEFAULT = "#161616";
const COLOR_HOVER = "#232323";
const COLOR_UNAVAILABLE = "#101010";
const COLOR_ACTIVE = "#3a0d0f";
const EDGE_DEFAULT = "rgba(255,255,255,0.18)";
const EDGE_ACTIVE = "#e31e24";
const EDGE_HOVER = "rgba(255,255,255,0.4)";

interface StudioMapRoomProps {
  node: StudioNode;
  layout: StudioMapLayoutEntry;
  isActive: boolean;
  onSelect: (id: string) => void;
  onHoverChange: (id: string | null) => void;
  reducedMotion: boolean;
}

// One room's volume on the architectural map — a plain box (no GLB, no
// Blender asset, generated straight from studioMapLayout.ts data per the
// brief) that lifts slightly on hover and shows a real tooltip, or sits
// dimmed and inert if the room isn't available yet (P03-P05).
export function StudioMapRoom({ node, layout, isActive, onSelect, onHoverChange, reducedMotion }: StudioMapRoomProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { invalidate } = useThree();
  const baseY = layout.position[1];

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const targetY = baseY + (hovered && node.available && !reducedMotion ? HOVER_LIFT : 0);
    const dy = targetY - mesh.position.y;
    if (Math.abs(dy) > 0.0005) {
      mesh.position.y += dy * Math.min(1, LIFT_SPEED * (1 / 60));
      invalidate();
    } else if (mesh.position.y !== targetY) {
      mesh.position.y = targetY;
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

  const color = !node.available ? COLOR_UNAVAILABLE : isActive ? COLOR_ACTIVE : hovered ? COLOR_HOVER : COLOR_DEFAULT;
  const edgeColor = !node.available ? EDGE_DEFAULT : isActive ? EDGE_ACTIVE : hovered ? EDGE_HOVER : EDGE_DEFAULT;

  return (
    <group position={layout.position}>
      <mesh
        ref={meshRef}
        position={[0, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <boxGeometry args={layout.size} />
        <meshStandardMaterial
          color={color}
          roughness={0.65}
          metalness={0.3}
          transparent={!node.available}
          opacity={node.available ? 1 : 0.25}
          emissive={isActive ? EDGE_ACTIVE : "#000000"}
          emissiveIntensity={isActive ? 0.18 : 0}
        />
        <Edges color={edgeColor} />
      </mesh>

      {isActive && (
        <Html position={[0, layout.size[1] / 2 + 0.32, 0]} center zIndexRange={[6, 0]} occlude={false}>
          <div className="kov-studio-map-pin" aria-hidden="true" />
        </Html>
      )}

      {hovered && node.available && (
        <Html position={[0, layout.size[1] / 2 + 0.45, 0]} center zIndexRange={[7, 0]} occlude={false}>
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
