"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { resolveCollisions } from "./collision";
import { EYE_HEIGHT, GALLERY_COLLIDERS, PLAYER_RADIUS, SPAWN, SPAWN_YAW } from "./galleryLayout";
import { playerState, resetPlayerState } from "./playerState";
import { usePlayerControls } from "./usePlayerControls";

const WALK_SPEED = 2.35; // m/s — a gallery pace, not a corridor sprint
const ACCEL = 9; // how fast the pace is reached, and lost
const LOOK_SENSITIVITY = 0.0022;
const PITCH_LIMIT = Math.PI / 2 - 0.08;

// Moving through the room.
//
// Pointer lock for looking, WASD/ZQSD/arrows for walking, a circle against
// boxes for collision. Everything is delta-timed, so the room walks the
// same on a 144Hz screen as on a 60Hz one — a speed multiplied by the
// frame count instead of the elapsed time is the oldest bug in this shape
// of code.
export function PlayerController({
  enabled,
  onLockChange,
}: {
  enabled: boolean;
  onLockChange: (locked: boolean) => void;
}) {
  const { camera, gl } = useThree();
  const setEvents = useThree((state) => state.setEvents);
  const input = usePlayerControls(enabled);
  const velocity = useRef({ x: 0, z: 0 });
  const pitch = useRef(0);
  const locked = useRef(false);

  // Arrival. Set once, imperatively: the camera is not React state and
  // re-running this on every render would teleport anyone who moved.
  //
  // react-hooks/immutability flags every write to `camera`. Same answer as
  // CameraController: useThree()'s camera is a live Three.js object meant
  // to be driven imperatively, and the rule's function-level analysis does
  // not match per-line disables — hence the block form.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    camera.rotation.order = "YXZ";
    camera.position.set(SPAWN[0], SPAWN[1], SPAWN[2]);
    camera.rotation.set(0, SPAWN_YAW, 0);
    pitch.current = 0;
    resetPlayerState();
    velocity.current.x = 0;
    velocity.current.z = 0;
  }, [camera]);
  /* eslint-enable react-hooks/immutability */

  // Where a click is aimed.
  //
  // R3F's default `compute` builds the ray from event.offsetX/offsetY,
  // and under pointer lock the browser freezes those at wherever the
  // cursor happened to be when the lock was taken. So every click in the
  // room was raycast from a stale point on the screen rather than from
  // the crosshair: you looked straight at a stand, clicked, and activated
  // whatever was under a cursor you could no longer see. While locked the
  // ray comes from the centre of the screen, which is the only thing the
  // reticle can honestly mean.
  useEffect(() => {
    setEvents({
      compute: (event, state) => {
        if (document.pointerLockElement) {
          state.pointer.set(0, 0);
        } else {
          state.pointer.set(
            (event.offsetX / state.size.width) * 2 - 1,
            -(event.offsetY / state.size.height) * 2 + 1
          );
        }
        state.raycaster.setFromCamera(state.pointer, state.camera);
      },
    });
  }, [setEvents]);

  useEffect(() => {
    const canvas = gl.domElement;

    const onClick = () => {
      if (!enabled || locked.current) return;
      // Chrome returns a promise here and rejects it if the user just
      // left a lock; swallowing it keeps a benign race out of the console.
      void canvas.requestPointerLock?.();
    };

    const onLock = () => {
      locked.current = document.pointerLockElement === canvas;
      onLockChange(locked.current);
    };

    const onMove = (event: MouseEvent) => {
      if (!locked.current) return;
      playerState.yaw -= event.movementX * LOOK_SENSITIVITY;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - event.movementY * LOOK_SENSITIVITY,
        -PITCH_LIMIT,
        PITCH_LIMIT
      );
    };

    canvas.addEventListener("click", onClick);
    document.addEventListener("pointerlockchange", onLock);
    document.addEventListener("mousemove", onMove);
    return () => {
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("pointerlockchange", onLock);
      document.removeEventListener("mousemove", onMove);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [enabled, gl, onLockChange]);

  /* eslint-disable react-hooks/immutability -- driving the live camera
     every frame is what useFrame is for; see the note on the effect above. */
  useFrame((_, rawDelta) => {
    // A tab that was in the background hands back a delta of several
    // seconds. Uncapped, that is one frame of walking straight through a
    // wall — the collision pass only sees where the visitor ended up.
    const delta = Math.min(rawDelta, 0.05);
    const state = playerState;

    camera.rotation.y = state.yaw;
    camera.rotation.x = pitch.current;

    const { forward, strafe } = input.current;
    const length = Math.hypot(forward, strafe);

    // Target velocity in world space. Normalised, so walking diagonally is
    // not forty per cent faster than walking straight.
    let targetX = 0;
    let targetZ = 0;
    if (enabled && length > 0) {
      const nf = forward / length;
      const ns = strafe / length;
      const sin = Math.sin(state.yaw);
      const cos = Math.cos(state.yaw);
      targetX = (-nf * sin + ns * cos) * WALK_SPEED;
      targetZ = (-nf * cos - ns * sin) * WALK_SPEED;
    }

    // Eased rather than snapped, in both directions: a gallery pace starts
    // and stops, it does not switch on.
    const blend = 1 - Math.exp(-ACCEL * delta);
    velocity.current.x += (targetX - velocity.current.x) * blend;
    velocity.current.z += (targetZ - velocity.current.z) * blend;

    const next = resolveCollisions(
      state.x + velocity.current.x * delta,
      state.z + velocity.current.z * delta,
      PLAYER_RADIUS,
      GALLERY_COLLIDERS
    );

    state.x = next.x;
    state.z = next.z;
    camera.position.set(next.x, EYE_HEIGHT, next.z);
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}
