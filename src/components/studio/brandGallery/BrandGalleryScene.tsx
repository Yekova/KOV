"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Brand } from "@/lib/studio/brands";
import { BrandStand } from "./BrandStand";
import { BrandGalleryExit } from "./BrandGalleryExit";
import {
  GALLERY_BOXES,
  GALLERY_COVES,
  GALLERY_HEIGHT,
  GALLERY_SLOTS,
  type GalleryMaterial,
  type GallerySlot,
} from "./galleryLayout";
import { PlayerController } from "./PlayerController";

// The palette. Concrete, graphite, black stone, dark wood, smoked glass,
// warm light — and red exactly twice in the whole room: the line in the
// floor and the edge of each plinth.
const MATERIALS: Record<GalleryMaterial, THREE.Material> = {
  // Dark grey, not black.
  //
  // The first pass painted this room in near-blacks — #16161a walls on a
  // #0d0d10 floor — and measured against three's own shading that was not
  // a dark room, it was an invisible one. An albedo of 0.004 linear,
  // divided by pi for Lambert, under a light at four metres, lands around
  // 0.001 — and ACES clamps everything below 0.0017 to exactly zero. Every
  // surface in the room rendered as rgb(0,0,0).
  //
  // A real black-box gallery is not painted black either. It is painted
  // dark grey and lit with hard falloff: the blackness is in the contrast,
  // not in the pigment. These values are that, checked back through the
  // same shading maths rather than picked by eye.
  concrete: new THREE.MeshStandardMaterial({ color: "#4e4e57", roughness: 0.93, metalness: 0.04 }),
  graphite: new THREE.MeshStandardMaterial({ color: "#5a5a64", roughness: 0.68, metalness: 0.28 }),
  blackStone: new THREE.MeshStandardMaterial({ color: "#35353c", roughness: 0.5, metalness: 0.22 }),
  darkWood: new THREE.MeshStandardMaterial({ color: "#43352a", roughness: 0.76, metalness: 0.06 }),
  smokedGlass: new THREE.MeshPhysicalMaterial({
    color: "#1a1a1f",
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
  angle = 0.95,
  distance = 18,
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
        penumbra={0.9}
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
/** A position nobody occupies.
 *
 *  Marked rather than lit. A light of its own would read the same on
 *  screen and cost a shader recompile every time one came into range —
 *  three rebuilds a material's program whenever the light count changes —
 *  so the marker emits instead: a warm edge on the form and a ring let
 *  into the plinth, both visible from down the room at no per-fragment
 *  cost at all.
 *
 *  It also says the right thing. A lit stand is an exhibit; a glowing
 *  outline is an address waiting for one. */
function Vacancy({ slot, geometry }: { slot: GallerySlot; geometry: THREE.BufferGeometry }) {
  return (
    <group position={slot.position} rotation={[0, slot.rotationY, 0]}>
      {/* A KOV volume, not a "space available" sign. */}
      <mesh position={[0, 0.45, 0]} geometry={geometry} material={MATERIALS.blackStone} scale={[1.6, 0.9, 0.7]} />
      <mesh position={[0, 1.34, 0]} rotation={[0.42, 0.8, 0]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color="#2f2f36"
          roughness={0.42}
          metalness={0.7}
          emissive="#ffd2a8"
          emissiveIntensity={0.12}
        />
      </mesh>
      <mesh position={[0, 0.906, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.46, 0.5, 48]} />
        <meshBasicMaterial color="#ffd2a8" toneMapped={false} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

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

      {/* Sky and bounce, in one light.
          
          Three does not compute a bounce, and in a room whose walls face
          each other that is most of the light there would be. This stands
          in for it: cool from the coves above, warm off the floor, and —
          the part that matters — strong enough that no surface in the
          room falls under the tone curve's black clamp. It was at 0.55,
          which contributed nothing measurable to anything. */}
      <hemisphereLight args={["#8fa2c0", "#6b543c", 2.8]} />

      {/* Four washes down the axis, warming and brightening toward the
          far recess: the north wall is the brightest surface in the room,
          which is what walks a visitor down a gallery without a sign
          telling them to. Intensities are candela over distance squared —
          the old values were roughly a tenth of what a fixture four
          metres up has to be. */}
      <Wash z={1.6} at={[0, 0, 1.2]} intensity={125} color="#ffcb9c" angle={1.0} />
      <Wash z={-4.6} at={[0, 0, -5]} intensity={140} color="#ffd0a2" />
      <Wash z={-10.4} at={[0, 0, -10.8]} intensity={155} color="#ffd4a8" />
      <Wash z={-15.4} at={[0, 0.9, -16.9]} intensity={100} color="#ffe0bd" angle={0.85} distance={16} />

      {/* Wall washers, two a side, mounted out from the wall rather than
          against it. Hard against it they grazed at fourteen degrees and
          the wall stayed black; at a third of the ceiling height out the
          light lands at about fifty, which is where a real wall washer is
          hung and why. */}
      <Wash x={-7.1} z={-3.2} at={[-8.85, 1.6, -2.8]} intensity={75} color="#9fb4d6" angle={0.85} distance={12} />
      <Wash x={-7.1} z={-11} at={[-8.85, 1.6, -11]} intensity={75} color="#9fb4d6" angle={0.85} distance={12} />
      <Wash x={7.1} z={-3.2} at={[8.85, 1.6, -2.8]} intensity={75} color="#9fb4d6" angle={0.85} distance={12} />
      <Wash x={7.1} z={-11} at={[8.85, 1.6, -11]} intensity={75} color="#9fb4d6" angle={0.85} distance={12} />

      {/* Cold spill from the doorway behind the visitor, so their own
          corner of the room is not the darkest one and the exit reads as
          an opening rather than as a wall. */}
      <pointLight position={[0, 2.6, 4.2]} intensity={26} distance={10} decay={2} color="#7d93c4" />

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
        <Vacancy key={slot.id} slot={slot} geometry={geometry} />
      ))}

      <BrandGalleryExit onNear={onExitZone} />
    </>
  );
}
