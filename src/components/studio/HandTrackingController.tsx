"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Move, ZoomIn } from "lucide-react";
import * as THREE from "three";
import type { CameraState } from "@/components/studio/CameraController";
import { MIN_PITCH, MAX_PITCH, MIN_FOV, MAX_FOV } from "@/components/studio/CameraController";

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

// MediaPipe hand-model landmark indices.
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
// The four MCP knuckles (index/middle/ring/pinky). Averaging wrist→each
// of them gives both a steadier tracked point than any single fingertip
// and a hand-size measure that isn't thrown off by one curled finger.
const MCP_INDICES = [5, 9, 13, 17];
const PALM_LANDMARK_INDICES = [WRIST, ...MCP_INDICES];

// Pinch = thumb tip to index tip, expressed as a fraction of the hand's
// own palm size, so the threshold holds whether the hand is near the lens
// or across the room. Two thresholds rather than one: a single threshold
// flickers open/closed on every frame the fingers hover right at it.
const PINCH_ON_RATIO = 0.55;
const PINCH_OFF_RATIO = 0.78;

// Drag gains — how much rotation a hand crossing the whole frame is
// worth. Because the pinch is a *drag* anchored on the frame you close
// your fingers, you can pinch, move, release and pinch again to keep
// turning indefinitely, exactly like re-grabbing with a mouse.
const YAW_PER_FRAME_WIDTH = 2.4;
const PITCH_PER_FRAME_HEIGHT = 1.6;

// Depth zoom: the hand's apparent palm size grows as it comes toward the
// lens. A ±30% change from the resting size covers the camera's whole
// FOV range, with a deadzone so small involuntary drift does nothing.
const ZOOM_DEADZONE = 0.07;
const ZOOM_SPAN_RANGE = 0.3;
// After the hand appears, and after every pinch release, the resting
// size/FOV are re-captured for this long instead of driving the zoom —
// so "neutral" is always wherever you're actually holding your hand.
const ZOOM_ARM_MS = 450;

// Adaptive (One Euro style) smoothing: heavy while the hand is nearly
// still so the view doesn't crawl when you're holding position, light
// while it's moving so a deliberate gesture doesn't feel laggy. A single
// fixed factor can only ever be one of the two.
const ALPHA_MIN = 0.12;
const ALPHA_MAX = 0.8;
const ALPHA_SPEED_GAIN = 16;

// Frames a hand must be continuously present before it drives anything —
// stops one false positive from yanking the view across the room.
const PRESENCE_FRAMES = 3;

type Status = "idle" | "unsupported" | "loading" | "requesting-camera" | "denied" | "tracking" | "no-hand" | "error";
type Gesture = "none" | "rotate" | "zoom";

const STATUS_LABEL: Record<Status, string> = {
  idle: "",
  unsupported: "Caméra non disponible sur ce navigateur.",
  loading: "Chargement du modèle…",
  "requesting-camera": "Autorisation de la caméra…",
  denied: "Accès à la caméra refusé.",
  tracking: "Main détectée",
  "no-hand": "Ouvrez la main devant la caméra",
  error: "Le suivi de la main a échoué.",
};

const GESTURE_LABEL: Record<Gesture, string> = {
  none: "Main détectée",
  rotate: "Rotation",
  zoom: "Zoom",
};

interface HandTrackingControllerProps {
  cameraStateRef: RefObject<CameraState>;
  enabled: boolean;
  /** Mirrors the current room's own `zoomEnabled` — a room that forbids
   * wheel/pinch zoom forbids hand-depth zoom too, rather than leaving one
   * input able to do what the others can't. */
  zoomEnabled: boolean;
}

// Opt-in webcam hand-tracking, with two deliberate gestures rather than
// one continuous "the view follows your hand" mapping:
//
//   • pinch (thumb + index) and move  → turn, as a drag anchored on the
//     frame you pinched — the same "drag the scene" direction and feel as
//     a mouse drag in CameraController.tsx, so the two inputs agree.
//   • open hand, move toward/away from the camera → zoom in/out, sprung
//     back to a neutral re-captured every time you release a pinch.
//
// An open hand that isn't moving in depth does nothing at all, which is
// what makes this usable: the view only changes when you actually ask it
// to, and the mouse stays free the rest of the time.
//
// Runs entirely client-side (MediaPipe's WASM runtime never sends frames
// anywhere) and only ever activates when `enabled` is true (the HUD
// toggle). It writes into the same `cameraStateRef` CameraController.tsx
// already reads every frame, so nothing there needed to change.
export function HandTrackingController({ cameraStateRef, enabled, zoomEnabled }: HandTrackingControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Lazy initializer (evaluated once at mount, not inside an effect) —
  // browser support for getUserMedia doesn't change at runtime, so this
  // never needs to be recomputed.
  const [status, setStatus] = useState<Status>(() => (supportsHandTracking() ? "idle" : "unsupported"));
  const [gesture, setGesture] = useState<Gesture>("none");

  // Read through a ref inside the detection loop so toggling zoom (or
  // walking into a room that disallows it) doesn't tear down and rebuild
  // the whole MediaPipe pipeline and camera stream.
  const zoomEnabledRef = useRef(zoomEnabled);
  useEffect(() => {
    zoomEnabledRef.current = zoomEnabled;
  }, [zoomEnabled]);

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

      const options = {
        runningMode: "VIDEO" as const,
        numHands: 1,
        // Raised from the 0.5 defaults: a half-confident detection is
        // exactly the kind that jumps between the hand and a face or a
        // background object, and one bad frame is very visible when it's
        // driving the camera.
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      };
      // GPU first, CPU as a real fallback rather than an error — the GPU
      // delegate fails outright on some drivers/browsers, and CPU
      // inference on a single hand at video rate is perfectly usable.
      try {
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: "GPU" },
          ...options,
        });
      } catch {
        if (cancelled) return;
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: "CPU" },
          ...options,
        });
      }
      if (cancelled) {
        handLandmarker.close();
        return;
      }

      setStatus("requesting-camera");
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // 640x480 is plenty for landmark detection and noticeably
          // cheaper to run inference on than whatever the webcam would
          // otherwise hand over (often 1080p).
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
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

      let lastVideoTime = -1;
      let presence = 0;
      let primed = false;
      let pinched = false;
      let smoothX = 0;
      let smoothY = 0;
      let smoothSpan = 0;
      // Pinch-drag anchor: the hand position and camera angles at the
      // instant the fingers closed.
      let anchorX = 0;
      let anchorY = 0;
      let anchorYaw = 0;
      let anchorPitch = 0;
      // Depth-zoom neutral.
      let baseSpan = 0;
      let baseFov = cameraStateRef.current.fov;
      let zoomArmedAt = 0;

      function detect() {
        rafId = requestAnimationFrame(detect);
        if (video.readyState < 2) return;
        // The <video> advances at its own rate (typically 30fps) while
        // rAF runs at the display's. Re-running inference on a frame
        // already processed burns CPU and feeds the smoother duplicate
        // samples, which reads as sluggishness.
        if (video.currentTime === lastVideoTime) return;
        lastVideoTime = video.currentTime;

        const result = handLandmarker.detectForVideo(video, performance.now());
        const landmarks = result.landmarks?.[0];

        if (!landmarks) {
          presence = 0;
          primed = false;
          pinched = false;
          setStatus((s) => (s === "tracking" ? "no-hand" : s));
          setGesture("none");
          return;
        }

        if (presence < PRESENCE_FRAMES) {
          presence += 1;
          if (presence === PRESENCE_FRAMES) zoomArmedAt = performance.now() + ZOOM_ARM_MS;
          return;
        }
        setStatus((s) => (s === "no-hand" ? "tracking" : s));

        let rawX = 0;
        let rawY = 0;
        for (const i of PALM_LANDMARK_INDICES) {
          rawX += landmarks[i].x;
          rawY += landmarks[i].y;
        }
        rawX /= PALM_LANDMARK_INDICES.length;
        rawY /= PALM_LANDMARK_INDICES.length;

        // Mean wrist→knuckle distance: the hand's apparent size in the
        // frame. It grows as the hand comes toward the lens (the depth
        // signal) and it's the scale every ratio below is measured
        // against (so nothing depends on how far away the visitor sits).
        let rawSpan = 0;
        for (const i of MCP_INDICES) {
          rawSpan += Math.hypot(landmarks[i].x - landmarks[WRIST].x, landmarks[i].y - landmarks[WRIST].y);
        }
        rawSpan = Math.max(rawSpan / MCP_INDICES.length, 0.0001);

        if (!primed) {
          smoothX = rawX;
          smoothY = rawY;
          smoothSpan = rawSpan;
          primed = true;
        } else {
          const speed = Math.hypot(rawX - smoothX, rawY - smoothY);
          const alpha = THREE.MathUtils.clamp(ALPHA_MIN + speed * ALPHA_SPEED_GAIN, ALPHA_MIN, ALPHA_MAX);
          smoothX += (rawX - smoothX) * alpha;
          smoothY += (rawY - smoothY) * alpha;
          // Size is the noisiest of the three signals and drives the
          // twitchiest effect (zoom), so it always gets the heavy filter.
          smoothSpan += (rawSpan - smoothSpan) * ALPHA_MIN;
        }

        const pinchRatio =
          Math.hypot(
            landmarks[THUMB_TIP].x - landmarks[INDEX_TIP].x,
            landmarks[THUMB_TIP].y - landmarks[INDEX_TIP].y
          ) / rawSpan;
        const nowPinched = pinched ? pinchRatio < PINCH_OFF_RATIO : pinchRatio < PINCH_ON_RATIO;

        const state = cameraStateRef.current;

        if (nowPinched && !pinched) {
          anchorX = smoothX;
          anchorY = smoothY;
          anchorYaw = state.yaw;
          anchorPitch = state.pitch;
        } else if (!nowPinched && pinched) {
          // Released: re-capture the zoom neutral from wherever the hand
          // ended up, and from whatever FOV is now on screen — so a zoom
          // you've set survives a rotation instead of springing back.
          zoomArmedAt = performance.now() + ZOOM_ARM_MS;
        }
        pinched = nowPinched;

        if (pinched) {
          // The raw frame isn't mirrored but the preview is, so moving
          // the hand to your right *lowers* x here while reading as
          // "right" on screen. Negating it makes a pinch-drag match
          // CameraController's own "drag the scene" convention (content
          // follows your hand) rather than inverting against the mouse.
          const dx = anchorX - smoothX;
          const dy = smoothY - anchorY;
          state.yaw = anchorYaw + dx * YAW_PER_FRAME_WIDTH;
          state.pitch = THREE.MathUtils.clamp(anchorPitch + dy * PITCH_PER_FRAME_HEIGHT, MIN_PITCH, MAX_PITCH);
          setGesture("rotate");
          return;
        }

        if (!zoomEnabledRef.current) {
          setGesture("none");
          return;
        }

        if (performance.now() < zoomArmedAt) {
          baseSpan = smoothSpan;
          baseFov = state.fov;
          setGesture("none");
          return;
        }

        const drift = smoothSpan / baseSpan - 1;
        if (Math.abs(drift) < ZOOM_DEADZONE) {
          setGesture("none");
          return;
        }
        const travel = drift - Math.sign(drift) * ZOOM_DEADZONE;
        // Hand closer (bigger span) → narrower FOV → zoomed in.
        state.fov = THREE.MathUtils.clamp(
          baseFov - (travel / ZOOM_SPAN_RANGE) * (MAX_FOV - MIN_FOV),
          MIN_FOV,
          MAX_FOV
        );
        setGesture("zoom");
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
      setGesture("none");
    };
  }, [enabled, cameraStateRef]);

  if (!enabled) return null;

  const live = status === "tracking";
  const ringColor = gesture === "rotate" ? "var(--kov-red)" : gesture === "zoom" ? "var(--kov-bone)" : "var(--glass-border)";

  return (
    // Centered under Nav's own pill rather than tucked into either side
    // column — the right side is already StudioHUD's row + StudioMap3D,
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
          border: `2px solid ${ringColor}`,
          background: "var(--kov-black)",
          boxShadow: "var(--glass-shadow-full)",
          transition: "border-color 0.2s ease",
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

      {(live || STATUS_LABEL[status]) && (
        <p
          className="px-2.5 py-1 text-[9px] uppercase tracking-widest text-center"
          style={{
            borderRadius: "var(--radius-pill)",
            background: gesture === "rotate" ? "var(--kov-red)" : "var(--glass-bg)",
            color: gesture === "rotate" ? "var(--kov-white)" : "var(--kov-bone)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
            maxWidth: 200,
            transition: "background 0.2s ease",
          }}
        >
          {live ? GESTURE_LABEL[gesture] : STATUS_LABEL[status]}
        </p>
      )}

      {/* The gestures aren't discoverable on their own — nothing on a 360°
          panorama suggests "pinch". The legend stays up the whole time the
          camera is on rather than fading after a few seconds. */}
      {(live || status === "no-hand") && (
        <div
          className="flex flex-col gap-1 px-3 py-2"
          style={{
            borderRadius: 10,
            background: "var(--glass-bg)",
            backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <span
            className="flex items-center gap-2 text-[9px] uppercase tracking-widest whitespace-nowrap"
            style={{ color: gesture === "rotate" ? "var(--kov-red)" : "var(--kov-steel)" }}
          >
            <Move size={11} aria-hidden="true" />
            Pincer + déplacer · tourner
          </span>
          <span
            className="flex items-center gap-2 text-[9px] uppercase tracking-widest whitespace-nowrap"
            style={{
              color: gesture === "zoom" ? "var(--kov-bone)" : "var(--kov-steel)",
              opacity: zoomEnabled ? 1 : 0.4,
            }}
          >
            <ZoomIn size={11} aria-hidden="true" />
            Avancer / reculer · zoomer
          </span>
        </div>
      )}
    </div>
  );
}
