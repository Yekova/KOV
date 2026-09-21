"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Brand } from "@/lib/studio/brands";
import { BrandStand } from "./BrandStand";
import { BrandGalleryExit } from "./BrandGalleryExit";
import { GALLERY_BOXES, GALLERY_COVES, GALLERY_HEIGHT, GALLERY_SLOTS, type GalleryMaterial } from "./galleryLayout";
import { PlayerController } from "./PlayerController";

// The palette. Concrete, graphite, black stone, dark wood, smoked glass,
// warm light — and red exactly twice in the whole room: the line in the
// floor and the edge of each plinth.
const MATERIALS: Record<GalleryMaterial, THREE.Material> = {
  concrete: new THREE.MeshStandardMaterial({ color: "#16161a", roughness: 0.94, metalness: 0.04 }),
  graphite: new THREE.MeshStandardMaterial({ color: "#1c1c20", roughness: 0.7, metalness: 0.3 }),
  // Polished, not matte. The floor is the largest surface in the room and
  // the only one every light reaches: at roughness 0.82 it swallowed the
  // pools whole, and a gallery floor that does not hold a reflection of
  // its own lighting reads as a grey plane with objects standing on it.
  blackStone: new THREE.MeshStandardMaterial({ color: "#0d0d10", roughness: 0.52, metalness: 0.22 }),
  darkWood: new THREE.MeshStandardMaterial({ color: "#241c15", roughness: 0.78, metalness: 0.06 }),
  smokedGlass: new THREE.MeshPhysicalMaterial({
    color: "#0a0a0c",
    roughness: 0.18,
    metalness: 0,
    transmission: 0.45,
    transparent: true,
    opacity: 0.5,
  }),
  // Additive, so a strip six centimetres wide still reads as a source
  // rather than as a pale line drawn on the ceiling. It is the cheapest
  // glow there is: no bloom pass, no second render target.
  warmLight: new THREE.MeshBasicMaterial({
    color: "#ffd2a4",
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
  redLine: new THREE.MeshBasicMaterial({
    color: "#e31e24",
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
};

/** A ceiling wash.
 *
 *  A spot aimed at the floor, not a bare point light. A point light in a
 *  black box lights the ceiling and the tops of the walls exactly as much
 *  as the floor, which is why the first pass read as an evenly grey room;
 *  what makes a gallery look like a gallery is a pool with a soft edge and
 *  darkness between pools. The target is a real object in the graph
 *  because that is how three.js aims a spot — its default target sits at
 *  the world origin, which would point every one of these at the same
 *  spot by the entrance. */
function Wash({
  x = 0,
  z,
  at,
  intensity,
  color,
  angle = 0.92,
  distance = 17,
}: {
  x?: number;
  z: number;
  /** Where the cone lands, [x, y, z]. */
  at: [number, number, number];
  intensity: number;
  color: string;
  angle?: number;
  distance?: number;
}) {
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <>
      <primitive object={target} position={at} />
      <spotLight
        position={[x, GALLERY_HEIGHT - 0.28, z]}
        target={target}
        angle={angle}
        penumbra={0.94}
        intensity={intensity}
        distance={distance}
        decay={2}
        color={color}
      />
    </>
  );
}

// The room.
//
// Lit by seven fixed sources and a lot of emissive geometry rather than by
// one light per fixture: a dynamic light costs every fragment it reaches,
// and a gallery with a light in each cove would be paying for an evenly
// lit room the whole point of which is that it is not evenly lit. The
// coves are additive strips — they read as the source without being one.
//
// The seven are not scattered. Four wash the axis, brightening toward the
// far recess so the room pulls you down it; two graze the side walls,
// because concrete only looks like concrete at a shallow angle; one is
// cold spill from the doorway behind you. Everything else in the room is
// lit by whichever stand you are standing at.
//
// Shadows are off entirely. In a room of matte black boxes under warm
// grazing light there is almost nothing for a shadow to land on that the
// ambient occlusion of the geometry does not already imply, and the shadow
// map would be the single most expensive thing on screen.
export function BrandGalleryScene({
  brands,
  controlsEnabled,
  onInteract,
  onExitZone,
  onLockChange,
}: {
  brands: Brand[];
  controlsEnabled: boolean;
  onInteract: (brand: Brand) => void;
  onExitZone: (near: boolean) => void;
  onLockChange: (locked: boolean) => void;
}) {
  // Geometry is shared across every box of the same size; the material
  // map above is shared across every box of the same kind. Between them
  // the room is a few dozen draws rather than a few hundred.
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // Positions that no brand occupies. Left as volumes rather than as
  // gaps: an empty gallery should read as a gallery between shows, not as
  // a page with missing content.
  const vacant = useMemo(() => {
    const taken = new Set(
      brands.map((brand) => `${Math.round(brand.position[0])}:${Math.round(brand.position[2])}`)
    );
    return GALLERY_SLOTS.filter((slot) => !taken.has(`${Math.round(slot.position[0])}:${Math.round(slot.position[2])}`));
  }, [brands]);

  return (
    <>
      <PlayerController enabled={controlsEnabled} onLockChange={onLockChange} />

      {/* Sky and bounce, in one light. A flat ambient lifts every face by
          the same amount, so a box lit only by ambient has no top and no
          side; a hemisphere gives the room a direction to be dark in —
          cool from the coves above, a little warm off the floor. */}
      <hemisphereLight args={["#2a3650", "#1b1209", 0.55]} />

      {/* Four washes down the axis, warming and brightening as they go:
          the far end of the room is the brightest thing in it, which is
          what walks a visitor down a gallery without a sign telling them
          to. */}
      <Wash z={1.6} at={[0, 0, 1.2]} intensity={13} color="#ffcb9c" angle={0.98} />
      <Wash z={-4.6} at={[0, 0, -5]} intensity={15} color="#ffd0a2" />
      <Wash z={-10.4} at={[0, 0, -10.8]} intensity={17} color="#ffd4a8" />
      <Wash z={-15.4} at={[0, 0.9, -16.9]} intensity={22} color="#ffe0bd" angle={0.8} distance={14} />

      {/* Two grazing washes down the side walls. Concrete only looks like
          concrete at a shallow angle — head-on it is a grey rectangle. */}
      <Wash x={-8.1} z={-4} at={[-8.9, 0.4, -4]} intensity={9} color="#9fb4d6" angle={0.72} distance={11} />
      <Wash x={8.1} z={-11} at={[8.9, 0.4, -11]} intensity={9} color="#9fb4d6" angle={0.72} distance={11} />

      {/* Cold spill from the doorway behind the visitor, so their own
          corner of the room is not the darkest one and the exit reads as
          an opening rather than as a wall. */}
      <pointLight position={[0, 2.4, 4.4]} intensity={7} distance={9} decay={2} color="#7d93c4" />

      {GALLERY_BOXES.map((box) => (
        <mesh
          key={box.id}
          geometry={geometry}
          material={MATERIALS[box.material]}
          position={box.position}
          scale={box.size}
        />
      ))}

      {GALLERY_COVES.map((cove) => (
        <mesh
          key={cove.id}
          geometry={geometry}
          material={MATERIALS[cove.material]}
          position={cove.position}
          scale={cove.size}
        />
      ))}

      {brands.map((brand) => (
        <BrandStand key={brand.id} brand={brand} onInteract={onInteract} />
      ))}

      {vacant.map((slot) => (
        <group key={slot.id} position={slot.position} rotation={[0, slot.rotationY, 0]}>
          {/* A KOV volume, not a "space available" sign. */}
          <mesh position={[0, 0.45, 0]} geometry={geometry} material={MATERIALS.blackStone} scale={[1.6, 0.9, 0.7]} />
          <mesh position={[0, 1.34, 0]} rotation={[0.42, 0.8, 0]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#17171b" roughness={0.42} metalness={0.7} />
          </mesh>
        </group>
      ))}

      <BrandGalleryExit onNear={onExitZone} />
    </>
  );
}
