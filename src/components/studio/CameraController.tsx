"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Narrowed per quality audit (was 55/80/68) — an architectural-photography
// framing rather than a GoPro-wide default. Note the trade-off: a narrower
// FOV shows a smaller angular slice of the panorama across the same
// screen width, so it packs *fewer* source texels per screen pixel — this
// reads as more magnified/soft against a fixed source resolution, not
// less. Requested independently of the resolution fix below; both apply.
export const MIN_FOV = 48;
export const MAX_FOV = 75;
export const DEFAULT_FOV = 62;
const MAX_PITCH = THREE.MathUtils.degToRad(75);
const MIN_PITCH = -MAX_PITCH;
// Deliberately low — "lente, premium, physique, précise", explicitly not
// FPS-game sensitivity (studio spec §08).
const DRAG_SENSITIVITY = 0.0022;
const INERTIA_DAMPING = 0.92;
const INERTIA_MIN_VELOCITY = 0.00004;
// A plain click/tap that never moves this far shouldn't rotate the camera
// at all — lets hotspot clicks land cleanly without a stray pixel of drag.
const DRAG_START_THRESHOLD_PX = 4;
const FOV_DAMP_SPEED = 6;

export interface CameraState {
  yaw: number;
  pitch: number;
  fov: number;
}

interface CameraControllerProps {
  domElement: HTMLElement | null;
  stateRef: RefObject<CameraState>;
  enabled: boolean;
  reducedMotion: boolean;
  /** False locks FOV at whatever stateRef.current.fov already is — wheel
   * and pinch gestures still get their default browser behavior prevented
   * (no page scroll/zoom), they just stop changing the camera. */
  zoomEnabled: boolean;
  onDragStateChange?: (dragging: boolean) => void;
}

// Click+drag look-around with light inertia and a clamped, interpolated
// zoom — no free camera translation, matching "Street View premium", not
// an FPS controller (studio spec §06/§33). All continuous state lives in
// refs (the caller's own stateRef, plus local velocity/drag refs here),
// updated inside useFrame — never React state, so looking around never
// triggers a re-render. The caller's stateRef is also what
// StudioDebugPanel polls and what navigateToNode's simulated camera-
// orient-toward-hotspot step animates directly.
export function CameraController({
  domElement,
  stateRef,
  enabled,
  reducedMotion,
  zoomEnabled,
  onDragStateChange,
}: CameraControllerProps) {
  const { camera } = useThree();
  const yawVelRef = useRef(0);
  const pitchVelRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartFovRef = useRef(DEFAULT_FOV);

  useEffect(() => {
    // react-hooks/immutability flags mutating `camera` — but this is the
    // normal, idiomatic React Three Fiber pattern: useThree()'s camera is
    // a live Three.js object meant to be driven imperatively (its own
    // rotation/fov aren't React state), same as any other object returned
    // from useFrame/useThree. Applies to every mutation below too.
    // eslint-disable-next-line react-hooks/immutability
    camera.rotation.order = "YXZ";
  }, [camera]);

  useEffect(() => {
    const el = domElement;
    if (!el || !enabled) return;

    function handlePointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      draggingRef.current = true;
      movedRef.current = false;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      yawVelRef.current = 0;
      pitchVelRef.current = 0;
      el!.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;

      if (!movedRef.current) {
        if (Math.abs(dx) + Math.abs(dy) < DRAG_START_THRESHOLD_PX) return;
        movedRef.current = true;
        onDragStateChange?.(true);
      }

      // Positive dx/dy (not negated) — "drag the scene", the Street View/
      // photo-sphere convention: content follows your finger/cursor
      // (drag right → the camera turns left, so what was on the right
      // slides toward the center, same direction as the drag). The
      // negated version felt like mouse-look instead (camera turns
      // toward the drag direction), which read as backwards.
      const dYaw = dx * DRAG_SENSITIVITY;
      const dPitch = dy * DRAG_SENSITIVITY;
      const s = stateRef.current;
      s.yaw += dYaw;
      s.pitch = THREE.MathUtils.clamp(s.pitch + dPitch, MIN_PITCH, MAX_PITCH);
      if (!reducedMotion) {
        yawVelRef.current = dYaw;
        pitchVelRef.current = dPitch;
      }
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    }

    function handlePointerUp(e: PointerEvent) {
      draggingRef.current = false;
      if (movedRef.current) onDragStateChange?.(false);
      movedRef.current = false;
      try {
        el?.releasePointerCapture(e.pointerId);
      } catch {
        // Capture may already be gone (e.g. pointercancel) — harmless.
      }
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      if (!zoomEnabled) return;
      stateRef.current.fov = THREE.MathUtils.clamp(stateRef.current.fov + e.deltaY * 0.02, MIN_FOV, MAX_FOV);
    }

    function touchDistance(t: TouchList) {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    }

    function handleTouchStart(e: TouchEvent) {
      if (zoomEnabled && e.touches.length === 2) {
        pinchStartDistRef.current = touchDistance(e.touches);
        pinchStartFovRef.current = stateRef.current.fov;
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (zoomEnabled && e.touches.length === 2 && pinchStartDistRef.current) {
        const scale = pinchStartDistRef.current / touchDistance(e.touches);
        stateRef.current.fov = THREE.MathUtils.clamp(pinchStartFovRef.current * scale, MIN_FOV, MAX_FOV);
      }
    }

    function handleTouchEnd() {
      pinchStartDistRef.current = null;
    }

    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointercancel", handlePointerUp);
    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerup", handlePointerUp);
      el.removeEventListener("pointercancel", handlePointerUp);
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [domElement, enabled, reducedMotion, zoomEnabled, onDragStateChange, stateRef]);

  /* eslint-disable react-hooks/immutability -- this rule doesn't know
     React Three Fiber's model: useFrame exists specifically to drive live
     Three.js objects (the camera) every frame, outside React's render
     cycle. Per-line disables don't reliably match this rule's function-
     level analysis, hence the block form for this whole callback. */
  useFrame(() => {
    const s = stateRef.current;

    if (!draggingRef.current && !reducedMotion) {
      if (Math.abs(yawVelRef.current) > INERTIA_MIN_VELOCITY || Math.abs(pitchVelRef.current) > INERTIA_MIN_VELOCITY) {
        s.yaw += yawVelRef.current;
        s.pitch = THREE.MathUtils.clamp(s.pitch + pitchVelRef.current, MIN_PITCH, MAX_PITCH);
        yawVelRef.current *= INERTIA_DAMPING;
        pitchVelRef.current *= INERTIA_DAMPING;
      } else {
        yawVelRef.current = 0;
        pitchVelRef.current = 0;
      }
    }

    camera.rotation.y = s.yaw;
    camera.rotation.x = s.pitch;

    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - s.fov) > 0.02) {
      cam.fov = reducedMotion ? s.fov : THREE.MathUtils.damp(cam.fov, s.fov, FOV_DAMP_SPEED, 1 / 60);
      cam.updateProjectionMatrix();
    }
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}
