"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { CameraState } from "@/components/studio/CameraController";
import { MIN_PITCH, MAX_PITCH } from "@/components/studio/CameraController";

// Version-pinned to the installed npm package (package.json) — the WASM
// runtime fetched from jsdelivr must match the JS API's own version, or
// the two can silently disagree on their wire format.
const WASM_FILESET_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
// MediaPipe's own hosted model asset (documented, stable URL — same one
// their official samples use). Not vendored locally: it's ~10MB and only
// ever needed by visitors who opt into this one feature.
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// `typeof x === "function"` rather than a bare truthiness check — the DOM
// lib types declare `getUserMedia` as a non-optional method, so checking
// `navigator.mediaDevices?.getUserMedia` directly as a boolean makes
// TypeScript flag it as always-true (TS2774), even though real older
// browsers can genuinely lack `navigator.mediaDevices` entirely.
function supportsHandTracking(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function";
}

// Palm-center landmarks (wrist + the four MCP knuckles) — averaging these
// five is a steadier tracked point than any single fingertip, which
// jitters more frame to frame.
const PALM_LANDMARK_INDICES = [0, 5, 9, 13, 17];

// Full hand excursion across the frame maps to this much look-around.
// Narrower than the camera's own pitch clamp (±75°) since a hand rarely
// travels the full frame height the way it does the width.
const HAND_YAW_RANGE = THREE.MathUtils.degToRad(70);
const HAND_PITCH_RANGE = MAX_PITCH * 0.8;
// Exponential smoothing factor applied to the raw per-frame landmark
// position — MediaPipe's own landmark output is noisy enough frame to
// frame that mapping it to camera rotation directly reads as jittery.
const SMOOTHING = 0.14;

type Status = "idle" | "unsupported" | "loading" | "requesting-camera" | "denied" | "tracking" | "no-hand" | "error";

const STATUS_LABEL: Record<Status, string> = {
  idle: "",
  unsupported: "Caméra non disponible sur ce navigateur.",
  loading: "Chargement du modèle…",
  "requesting-camera": "Autorisation de la caméra…",
  denied: "Accès à la caméra refusé.",
  tracking: "Main détectée",
  "no-hand": "Recherche d'une main…",
  error: "Le suivi de la main a échoué.",
};

interface HandTrackingControllerProps {
  cameraStateRef: RefObject<CameraState>;
  enabled: boolean;
}

// Opt-in webcam hand-tracking: moving an open hand across the frame pans
// the room's look direction, instead of dragging with a mouse/finger.
// Runs entirely client-side (MediaPipe's WASM runtime never sends frames
// anywhere) — this component only ever activates when `enabled` is true
// (the HUD toggle in StudioHUD.tsx/StudioExperience.tsx), never on its
// own. It writes into the same `cameraStateRef` CameraController.tsx
// already reads every frame, so no changes were needed there: whichever
// input last wrote yaw/pitch is simply what the camera shows.
export function HandTrackingController({ cameraStateRef, enabled }: HandTrackingControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Lazy initializer (evaluated once at mount, not inside an effect) —
  // browser support for getUserMedia doesn't change at runtime, so this
  // never needs to be recomputed.
  const [status, setStatus] = useState<Status>(() => (supportsHandTracking() ? "idle" : "unsupported"));

  useEffect(() => {
    if (!enabled || !supportsHandTracking()) return;

    // Captured once, up front — the same node is reused by both `start`
    // below and this effect's own cleanup, which must not read
    // `videoRef.current` fresh (it could differ by the time cleanup runs).
    // Rebound to a non-null-typed const: TS's narrowing from the guard
    // above doesn't carry into the nested `start`/`detect` closures
    // otherwise, since a function declaration is conservatively treated
    // as callable at any time regardless of it being invoked immediately
    // below.
    const maybeVideo = videoRef.current;
    if (!maybeVideo) return;
    const video: HTMLVideoElement = maybeVideo;

    let cancelled = false;
    let stream: MediaStream | null = null;
    // The MediaPipe Tasks Vision types aren't worth importing just for
    // this local variable; the calls made against it below are the same
    // ones documented in MediaPipe's own usage examples.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handLandmarker: any = null;
    let rafId = 0;

    async function start() {
      setStatus("loading");
      const { HandLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      if (cancelled) return;

      const vision = await FilesetResolver.forVisionTasks(WASM_FILESET_URL);
      if (cancelled) return;

      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
      });
      if (cancelled) {
        handLandmarker.close();
        return;
      }

      setStatus("requesting-camera");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      video.srcObject = stream;
      await video.play().catch(() => {});
      if (cancelled) return;

      setStatus("no-hand");

      let smoothedYaw = cameraStateRef.current.yaw;
      let smoothedPitch = cameraStateRef.current.pitch;

      function detect() {
        rafId = requestAnimationFrame(detect);
        if (video.readyState < 2) return;

        const result = handLandmarker.detectForVideo(video, performance.now());
        const landmarks = result.landmarks?.[0];
        if (!landmarks) {
          setStatus((s) => (s === "tracking" ? "no-hand" : s));
          return;
        }
        setStatus((s) => (s === "no-hand" ? "tracking" : s));

        let x = 0;
        let y = 0;
        for (const i of PALM_LANDMARK_INDICES) {
          x += landmarks[i].x;
          y += landmarks[i].y;
        }
        x /= PALM_LANDMARK_INDICES.length;
        y /= PALM_LANDMARK_INDICES.length;

        // Mirrored horizontally to match the mirrored preview below (a
        // plain selfie-style "what the camera sees, flipped" view) —
        // moving the hand right (as seen in that mirrored preview) should
        // pan the room right. Sign/scale here are a first pass — worth
        // nudging live if it reads as reversed or over/under-sensitive.
        const offsetX = 0.5 - x;
        const offsetY = 0.5 - y;

        const targetYaw = offsetX * HAND_YAW_RANGE * 2;
        const targetPitch = THREE.MathUtils.clamp(offsetY * HAND_PITCH_RANGE * 2, MIN_PITCH, MAX_PITCH);

        smoothedYaw += (targetYaw - smoothedYaw) * SMOOTHING;
        smoothedPitch += (targetPitch - smoothedPitch) * SMOOTHING;
        cameraStateRef.current.yaw = smoothedYaw;
        cameraStateRef.current.pitch = smoothedPitch;
      }
      rafId = requestAnimationFrame(detect);
    }

    start().catch(() => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
      handLandmarker?.close();
      video.srcObject = null;
    };
  }, [enabled, cameraStateRef]);

  if (!enabled) return null;

  return (
    // Centered under Nav's own pill rather than tucked into either side
    // column — the right side is already StudioHUD's row + StudioMiniMap,
    // the left is StudioRoomPanel, and this needed a spot clear of both
    // regardless of which room is active.
    <div
      className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      style={{ zIndex: "var(--z-nav)" }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          border: `2px solid ${status === "tracking" ? "var(--kov-red)" : "var(--glass-border)"}`,
          background: "var(--kov-black)",
          boxShadow: "var(--glass-shadow-full)",
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>
      {STATUS_LABEL[status] && (
        <p
          className="px-2.5 py-1 text-kov-bone text-[9px] uppercase tracking-widest text-center"
          style={{
            borderRadius: "var(--radius-pill)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
            maxWidth: 180,
          }}
        >
          {STATUS_LABEL[status]}
        </p>
      )}
    </div>
  );
}
