"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { CameraState } from "@/components/studio/CameraController";

/** The sphere every hotspot in studioNodes.ts sits on. Read off the
 *  existing entries — [0,-30,-480], [420,-20,-260], [-420,-20,-260] all
 *  land within a few units of this radius. */
const HOTSPOT_RADIUS = 480;

/** Where the cursor is pointing, in the numbers studioNodes.ts actually
 *  takes.
 *
 *  Deliberately outside the <Canvas>. It could have used R3F's own camera
 *  and unproject(), but that would mean a drei <Html fullscreen> overlay
 *  sitting across the whole viewport in production — and the one thing
 *  this experience cannot afford is another transparent layer between the
 *  cursor and the drag. Plain DOM, one pointermove listener on the canvas
 *  element, and the maths done from the camera state the controller
 *  already keeps.
 *
 *  The maths mirrors CameraController exactly: it sets rotation.order to
 *  "YXZ" with rotation.y = yaw and rotation.x = pitch, so a ray built in
 *  camera space and turned by Euler(pitch, yaw, 0, "YXZ") lands where the
 *  renderer is actually looking. Inverting that gives back a yaw and pitch
 *  that can be pasted straight into initialYaw / initialPitch.
 */
export function StudioPointerReadout({
  element,
  stateRef,
}: {
  element: HTMLElement | null;
  stateRef: RefObject<CameraState>;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef("");
  const [hidden, setHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!element) return;

    const dir = new THREE.Vector3();
    const euler = new THREE.Euler(0, 0, 0, "YXZ");

    const onMove = (event: PointerEvent) => {
      const state = stateRef.current;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Pointer to normalised device coordinates, then to a ray in camera
      // space. tan(fov/2) is the half-height of the near plane at unit
      // depth; the horizontal half-width is that times the aspect.
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      const halfHeight = Math.tan(THREE.MathUtils.degToRad(state.fov) / 2);
      const aspect = rect.width / rect.height;

      dir.set(ndcX * halfHeight * aspect, ndcY * halfHeight, -1).normalize();
      euler.set(state.pitch, state.yaw, 0, "YXZ");
      dir.applyEuler(euler);

      // Back out of the direction into the two angles the config takes.
      // The camera looks down -Z, so a yaw of 0 points at (0, 0, -1) and
      // atan2(-x, -z) is the inverse of the rotation applied above.
      const yaw = Math.atan2(-dir.x, -dir.z);
      const pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));

      const x = Math.round(dir.x * HOTSPOT_RADIUS);
      const y = Math.round(dir.y * HOTSPOT_RADIUS);
      const z = Math.round(dir.z * HOTSPOT_RADIUS);

      valueRef.current = `[${x}, ${y}, ${z}] · yaw ${yaw.toFixed(3)} · pitch ${pitch.toFixed(3)}`;
      if (textRef.current) textRef.current.textContent = valueRef.current;
    };

    element.addEventListener("pointermove", onMove);
    return () => element.removeEventListener("pointermove", onMove);
  }, [element, stateRef]);

  const copy = useCallback(() => {
    if (!valueRef.current) return;
    void navigator.clipboard
      ?.writeText(valueRef.current)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => setCopied(false));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;

      if (event.key === "c" || event.key === "C") copy();
      if (event.key === "h" || event.key === "H") setHidden((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy]);

  if (hidden) return null;

  return (
    <div
      // No pointer events at all: this sits over the canvas and the canvas
      // is dragged. Copying is on a key, not a click, for exactly that
      // reason.
      className="absolute inset-x-0 bottom-4 hidden md:flex items-center justify-center pointer-events-none"
      style={{ zIndex: "var(--z-nav)" }}
    >
      <p
        className="flex items-center gap-3 px-3 py-1.5 font-mono"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          color: "rgba(231,231,229,0.5)",
          background: "rgba(8,8,9,0.5)",
          border: "1px solid var(--kov-border)",
          borderRadius: "var(--radius-pill)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span ref={textRef}>[0, 0, 0] · yaw 0.000 · pitch 0.000</span>
        <span aria-hidden="true" style={{ opacity: 0.35 }}>
          {copied ? "COPIÉ" : "C copier · H masquer"}
        </span>
      </p>
    </div>
  );
}
