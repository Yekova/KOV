"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { animate } from "framer-motion";
import * as THREE from "three";
import { StudioIntro } from "@/components/studio/StudioIntro";
import { StudioHUD } from "@/components/studio/StudioHUD";
import { StudioCanvasContent } from "@/components/studio/StudioCanvasContent";
import { StudioNavigationOverlay, NAV_COVER_MS } from "@/components/studio/StudioNavigationOverlay";
import { StudioProjectPanel } from "@/components/studio/StudioProjectPanel";
import { StudioInfoPanel } from "@/components/studio/StudioInfoPanel";
import { StudioRoomPanel } from "@/components/studio/StudioRoomPanel";
import { StudioRoomCarousel } from "@/components/studio/StudioRoomCarousel";
import { StudioMap3D } from "@/components/studio/map/StudioMap3D";
import { StudioFooter } from "@/components/studio/StudioFooter";
import { StudioMusicPlayer } from "@/components/studio/StudioMusicPlayer";
import { HandTrackingController } from "@/components/studio/HandTrackingController";
import { StudioErrorScreen } from "@/components/studio/StudioErrorScreen";
import { StudioErrorBoundary } from "@/components/studio/StudioErrorBoundary";
import { Nav } from "@/components/navigation/Nav";
import { StudioTour } from "@/components/studio/StudioTour";
import { StudioDiagnosticsPanel } from "@/components/studio/StudioDiagnosticsPanel";
import { initDiagnostics, diag, registerRendererProbe } from "@/lib/studioDiagnostics";
import { DEFAULT_FOV, type CameraState } from "@/components/studio/CameraController";
import { GlobalMenuProvider, useGlobalMenu } from "@/components/layout/GlobalMenuContext";
import { GlobalOverviewMenu } from "@/components/layout/GlobalOverviewMenu";
import {
  STUDIO_NODES,
  STUDIO_NODE_ORDER,
  STUDIO_ENTRY_NODE_ID,
  type StudioArtwork,
  type StudioInfoHotspot,
} from "@/config/studio/studioNodes";

// idle/loading collapse into "intro" (the intro screen itself carries a
// `textureReady` sub-state for its button) — a smaller state set than the
// spec's suggested six, but it maps to the same real UI states without a
// phase that never has distinct rendering. transitioning still fully
// blocks input, same guarantee (studio spec §31).
type EnginePhase = "intro" | "revealing" | "exploring" | "transitioning" | "error";

// Entry reveal. Shorter than the old 1200ms: it used to animate a
// full-screen CSS blur on the live WebGL canvas, which needs a real hold to
// read at all. Now that it's opacity and a transform, the same gesture
// lands cleanly in less time.
const REVEAL_DURATION_MS = 760;
// How long the black stays fully closed once it has closed, before the swap
// is allowed to happen. Just enough that the changeover reads as a beat
// rather than a stutter — the swap itself waits on this AND on the texture.
const NAV_HOLD_MS = 160;
const TOUR_SEEN_KEY = "kov-studio-tour-seen";
// How long to wait for the browser to hand back a lost WebGL context
// before giving up and showing the retry screen. Generous on purpose: a
// GPU process that is being restarted can take several seconds, and
// throwing up an error screen on a context that was about to come back is
// the worse failure of the two.
const CONTEXT_RESTORE_GRACE_MS = 9000;

const DEBUG = process.env.NODE_ENV !== "production";

// Single-purpose loader: same texture setup (colorSpace, mip chain, filter)
// used both for the entry node's load and every real inter-node navigation,
// so a node's panorama always ends up configured identically regardless of
// which of the two call sites loaded it.
function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.minFilter = THREE.LinearMipmapLinearFilter;
        loaded.magFilter = THREE.LinearFilter;
        loaded.generateMipmaps = true;
        loaded.needsUpdate = true;
        resolve(loaded);
      },
      undefined,
      reject
    );
  });
}

// A single panorama fetch has no meaningful multi-stage "progress" of its
// own, and on a warm cache it resolves near-instantly — neither reads as a
// deliberate loading moment. This plays a randomized fast/slow/fast curve
// up to 92% regardless of how fast the real texture actually loads (the
// intro always gets its full moment), then holds at 92% for however long
// the real load still needs (rare — only a cold, slow connection), and
// only ramps to 100% once the texture is genuinely in memory — it never
// claims completion before that's true.
function runIntroLoadingCurve(setProgress: (pct: number) => void, onDone: () => void, isCancelled: () => boolean) {
  const controls: ReturnType<typeof animate>[] = [];
  let current = 0;
  let curveDone = false;
  let textureDone = false;

  function update(v: number) {
    current = v;
    setProgress(v);
  }

  function finishIfReady() {
    if (isCancelled() || !curveDone || !textureDone) return;
    controls.push(animate(current, 100, { duration: 0.3, ease: "easeOut", onUpdate: update, onComplete: onDone }));
  }

  const fastStart = 35 + Math.random() * 15; // 35-50, quick initial burst
  const slowMid = 70 + Math.random() * 15; // 70-85, deliberately drags
  const fastEnd = 92; // held here until the real texture is actually ready

  controls.push(
    animate(0, fastStart, {
      duration: (300 + Math.random() * 200) / 1000,
      ease: "easeOut",
      onUpdate: update,
      onComplete: () => {
        if (isCancelled()) return;
        controls.push(
          animate(fastStart, slowMid, {
            duration: (900 + Math.random() * 500) / 1000,
            ease: "linear",
            onUpdate: update,
            onComplete: () => {
              if (isCancelled()) return;
              controls.push(
                animate(slowMid, fastEnd, {
                  duration: (300 + Math.random() * 200) / 1000,
                  ease: "easeOut",
                  onUpdate: update,
                  onComplete: () => {
                    curveDone = true;
                    finishIfReady();
                  },
                })
              );
            },
          })
        );
      },
    })
  );

  return {
    notifyTextureReady() {
      textureDone = true;
      finishIfReady();
    },
    stop() {
      controls.forEach((c) => c.stop());
    },
  };
}

export function StudioExperience() {
  return (
    <GlobalMenuProvider>
      <StudioExperienceInner />
    </GlobalMenuProvider>
  );
}

function StudioExperienceInner() {
  const { open: menuOpen, toggle: toggleMenu, close: closeMenu } = useGlobalMenu();
  // Lazy initializer rather than an effect: the breadcrumb trail has to be
  // armed before anything else in this component can fail, and it must
  // rotate the previous session's trail aside exactly once. Entirely inert
  // unless ?diag=1 was used in this tab.
  useState(() => {
    initDiagnostics();
    diag("studio:mount");
    return null;
  });
  const [handTrackingEnabled, setHandTrackingEnabled] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  // A WebGL context can be taken away from the page at any moment — a
  // driver reset, GPU memory pressure, the browser's GPU process being
  // restarted underneath us — with nothing in this code as the cause.
  // Until now that ended the visit; these two make it recoverable.
  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  // "pending" only ever becomes "open" once the HUD is fully built (see the
  // mapReady effect) — a tour that points at controls that haven't mounted
  // yet would silently drop half its steps.
  const [tourState, setTourState] = useState<"pending" | "open" | "done">(() => {
    if (typeof window === "undefined") return "pending";
    try {
      return window.localStorage.getItem(TOUR_SEEN_KEY) === "1" ? "done" : "pending";
    } catch {
      // Blocked storage — show it, rather than refusing to on a technicality.
      return "pending";
    }
  });
  const [phase, setPhase] = useState<EnginePhase>("intro");
  const [currentNodeId, setCurrentNodeId] = useState(STUDIO_ENTRY_NODE_ID);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const [navOverlayActive, setNavOverlayActive] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [canvasEl, setCanvasEl] = useState<HTMLDivElement | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedArtwork, setSelectedArtwork] = useState<StudioArtwork | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<StudioInfoHotspot | null>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  // ?nomusic=1 skips the Lounge's music player entirely. The Lounge is the
  // only room that mounts it and the only room that crashes the tab, while
  // the Rooftop — same data shape, a heavier panorama — never has. This
  // makes that the one variable a single reload can isolate for certain,
  // instead of another round of inference.
  const [musicDisabled] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("nomusic") === "1"
  );

  const currentNode = STUDIO_NODES[currentNodeId];
  const cameraStateRef = useRef<CameraState>({
    yaw: currentNode.initialYaw,
    pitch: currentNode.initialPitch,
    fov: DEFAULT_FOV,
  });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const contextLostTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Entry load only — single loader, single source of truth: the same
  // texture object used for "is it ready" (the intro button) is the one
  // actually handed to PanoramaSphere, no separate drei/useTexture load
  // racing this one against a different completion signal for the same
  // URL. Real inter-node navigation loads its own texture inside
  // navigateToNode below, since by then the engine is already past the
  // intro and needs a different transition (fade through
  // StudioNavigationOverlay, not the intro's blur-reveal) and a different
  // failure response (abort the transition, not a full-screen error).
  useEffect(() => {
    if (currentNodeId !== STUDIO_ENTRY_NODE_ID) return;
    let cancelled = false;
    const curve = runIntroLoadingCurve(
      setLoadProgress,
      () => setIntroReady(true),
      () => cancelled
    );

    diag("intro:texture-load-start", STUDIO_ENTRY_NODE_ID);
    loadTexture(STUDIO_NODES[STUDIO_ENTRY_NODE_ID].panorama)
      .then((loaded) => {
        if (cancelled) {
          loaded.dispose();
          return;
        }
        diag("intro:texture-loaded");
        setTexture(loaded);
        curve.notifyTextureReady();
      })
      .catch(() => {
        diag("intro:texture-failed");
        if (!cancelled) setPhase("error");
      });
    return () => {
      cancelled = true;
      curve.stop();
    };
    // retryKey is otherwise inert — bumping it is purely what makes
    // handleRetry re-run this load after a failure.
  }, [currentNodeId, retryKey]);

  useEffect(() => () => texture?.dispose(), [texture]);

  useEffect(() => {
    diag("room:active", currentNodeId);
  }, [currentNodeId]);

  // The studio map is a second WebGL context with a couple of hundred
  // meshes behind it. Mounting it in the same commit that reveals the
  // panorama meant building an entire second scene while the entry
  // animation was still playing — the most expensive possible moment. It
  // now waits for the browser to actually be idle, with a timeout so it
  // still arrives promptly on a busy machine.
  useEffect(() => {
    if (phase !== "exploring" || mapReady) return;
    let cancelled = false;
    const idle = (window as Window & typeof globalThis).requestIdleCallback;
    const show = () => {
      if (!cancelled) setMapReady(true);
    };
    if (typeof idle === "function") {
      idle(show, { timeout: 1200 });
    } else {
      const timer = setTimeout(show, 400);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [phase, mapReady]);

  // Started only once the map has mounted, since it is one of the things
  // the tour points at. The short delay after that lets its own fade-in
  // finish, so the first highlight lands on a settled element.
  useEffect(() => {
    if (!mapReady || tourState !== "pending") return;
    const timer = setTimeout(() => setTourState("open"), 700);
    return () => clearTimeout(timer);
  }, [mapReady, tourState]);

  const closeTour = useCallback(() => {
    setTourState("done");
    try {
      window.localStorage.setItem(TOUR_SEEN_KEY, "1");
    } catch {
      // Blocked storage — the tour simply offers itself again next visit.
    }
  }, []);

  useEffect(() => () => clearTimeout(contextLostTimerRef.current), []);

  // Warms the HTTP cache for every room reachable from here while the
  // visitor is still looking around — by the time they actually click a
  // hotspot, the target panorama's bytes are typically already local, so
  // the real load inside navigateToNode resolves fast enough to land
  // inside StudioNavigationOverlay's cover window instead of racing it.
  //
  // Bytes only — deliberately NOT an <img> + decode(). That earlier
  // version was the Lounge crash: the Portal has three reachable rooms,
  // and decode() forces each panorama into a full uncompressed raster in
  // the renderer process (6144x3072 is ~72MB, the old 8192x4096 was
  // ~128MB) purely to throw it away. Three of those, plus the current
  // room's own decoded texture, plus the decode of whichever room you
  // then navigate to, is enough to OOM the tab ("this page couldn't
  // load") on a normal laptop. fetch() gets the exact same HTTP-cache
  // warming for the compressed ~1MB, and the decode then happens once,
  // where it's actually needed: inside loadTexture.
  useEffect(() => {
    if (phase !== "exploring") return;
    const controller = new AbortController();

    async function prefetchReachableRooms() {
      for (const connection of currentNode.connections) {
        const target = STUDIO_NODES[connection.targetNodeId];
        if (!target?.panorama) continue;
        try {
          diag("prefetch:start", target.id);
          const response = await fetch(target.panorama, {
            signal: controller.signal,
            cache: "force-cache",
          });
          // The body has to be drained for the response to actually land
          // in the HTTP cache — but it's the compressed bytes, never a
          // bitmap, and it goes out of scope immediately.
          await response.arrayBuffer();
          diag("prefetch:done", target.id);
        } catch {
          // Aborted (left the room) or offline — prefetching is a pure
          // optimisation, navigation loads its own texture regardless.
          return;
        }
      }
    }
    prefetchReachableRooms();

    return () => controller.abort();
  }, [phase, currentNode]);

  function handleEnter() {
    if (!texture) return;
    setPhase("revealing");
    timersRef.current.push(setTimeout(() => setPhase("exploring"), REVEAL_DURATION_MS));
  }

  function handleRetry() {
    setTexture(null);
    setLoadProgress(0);
    setIntroReady(false);
    setRetryKey((k) => k + 1);
    setPhase("intro");
  }

  const navigateToNode = useCallback(
    (targetId: string) => {
      if (phase !== "exploring") return;
      const targetNode = STUDIO_NODES[targetId];
      if (!targetNode || !targetNode.available) return;

      setPhase("transitioning");
      setSelectedArtwork(null);
      setSelectedInfo(null);

      diag("nav:start", `${currentNode.id} -> ${targetId}`);
      if (DEBUG) {
        console.info(`Navigation target: ${targetId}`);
      }

      const connection = currentNode.connections.find((c) => c.targetNodeId === targetId);
      if (connection && !reducedMotion) {
        const [x, , z] = connection.position;
        const targetYaw = Math.atan2(x, -z);
        const startYaw = cameraStateRef.current.yaw;
        // Shortest angular path, and only a partial nudge toward it — "un
        // mini travelling visuel", not a hard snap (studio spec §32).
        const deltaYaw = ((targetYaw - startYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
        animate(0, 1, {
          duration: 0.6,
          ease: "easeOut",
          onUpdate: (t) => {
            cameraStateRef.current.yaw = startYaw + deltaYaw * 0.3 * t;
          },
        });
      }

      // The black starts closing immediately, and the swap waits for it to
      // be *fully* closed — not for a timer that happened to be the same
      // length as the whole animation. Nothing is allowed to change on
      // screen until there is nothing visible to change.
      setNavOverlayActive(true);

      const covered = new Promise<void>((resolve) => {
        timersRef.current.push(setTimeout(resolve, reducedMotion ? 0 : NAV_COVER_MS + NAV_HOLD_MS));
      });

      diag("nav:texture-load-start", targetId);
      Promise.all([loadTexture(targetNode.panorama).then((t) => (diag("nav:texture-decoded", targetId), t)), covered])
        .then(([loaded]) => {
          // The pre-existing `useEffect(() => () => texture?.dispose(), [texture])`
          // below disposes whatever texture this replaces once React commits
          // it — no manual dispose needed here.
          diag("nav:swap-commit", targetId);
          setTexture(loaded);
          setCurrentNodeId(targetId);
          cameraStateRef.current.yaw = targetNode.initialYaw;
          cameraStateRef.current.pitch = targetNode.initialPitch;
          cameraStateRef.current.fov = DEFAULT_FOV;
          setPhase("exploring");

          // Two frames, deliberately: the first lets React commit the new
          // texture, the second lets the renderer actually paint it. Only
          // then does the black open. Lifting it in the same tick as the
          // swap is what made the old room visible during the changeover.
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              setNavOverlayActive(false);
              diag("nav:committed", targetId);
            })
          );
        })
        .catch(() => {
          diag("nav:failed", targetId);
          // A failed mid-experience navigation aborts the transition and
          // stays on the current, already-working node instead of tearing
          // down the whole 360° experience the visitor is already in —
          // StudioErrorScreen's full-screen takeover is reserved for the
          // initial load, where there's nothing yet to fall back to.
          if (DEBUG) console.error(`Failed to load panorama for ${targetId}`);
          setNavOverlayActive(false);
          setPhase("exploring");
        });
    },
    [phase, currentNode, reducedMotion]
  );

  const handleSelectArtwork = useCallback((artwork: StudioArtwork) => {
    setSelectedArtwork(artwork);
  }, []);

  const handleCloseArtworkPanel = useCallback(() => setSelectedArtwork(null), []);

  const handleSelectInfo = useCallback((hotspot: StudioInfoHotspot) => {
    setSelectedInfo(hotspot);
  }, []);

  const handleCloseInfoPanel = useCallback(() => setSelectedInfo(null), []);

  // StudioRoomPanel's prev/next follow STUDIO_NODE_ORDER (the board's own
  // "N/6" sequence) rather than the connections graph directly — but an
  // arrow only enables when a real connection to that neighbor exists, so
  // it never silently jumps to an unreachable/unavailable room.
  const roomIndex = STUDIO_NODE_ORDER.indexOf(currentNodeId);
  const prevNodeId = roomIndex > 0 ? STUDIO_NODE_ORDER[roomIndex - 1] : undefined;
  const nextNodeId = roomIndex < STUDIO_NODE_ORDER.length - 1 ? STUDIO_NODE_ORDER[roomIndex + 1] : undefined;
  const canGoPrev = Boolean(prevNodeId && currentNode.connections.some((c) => c.targetNodeId === prevNodeId));
  const canGoNext = Boolean(nextNodeId && currentNode.connections.some((c) => c.targetNodeId === nextNodeId));

  if (phase === "error") {
    return (
      <>
        <StudioErrorScreen onRetry={handleRetry} />
        <StudioDiagnosticsPanel />
      </>
    );
  }

  const controlsEnabled = phase === "exploring";
  const canvasRevealed = phase !== "intro";

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "#050505" }}>
      <div
        ref={setCanvasEl}
        className="absolute inset-0"
        style={{
          opacity: canvasRevealed ? 1 : 0,
          // Opacity and a transform, never `filter`. This used to animate
          // blur(20px) -> blur(0) across a full-screen WebGL canvas, which
          // forces the compositor to re-blur the entire viewport every
          // single frame — the one thing guaranteed to stutter on the
          // integrated GPUs most visitors actually have. A slight push-in
          // reads as the same "coming into focus" gesture and costs nothing:
          // both properties are handled on the compositor without repainting.
          transform: canvasRevealed || reducedMotion ? "scale(1)" : "scale(1.045)",
          transformOrigin: "center",
          willChange: canvasRevealed ? "auto" : "opacity, transform",
          transition: reducedMotion
            ? "opacity 0.4s ease"
            : `opacity ${REVEAL_DURATION_MS}ms cubic-bezier(0.22,1,0.36,1), transform ${REVEAL_DURATION_MS}ms cubic-bezier(0.22,1,0.36,1)`,
          cursor: controlsEnabled ? (dragging ? "grabbing" : "grab") : "default",
          touchAction: "none",
        }}
      >
        <Canvas
          key={canvasKey}
          // [min,max] — R3F clamps to the device's actual devicePixelRatio
          // within this range automatically (min(devicePixelRatio, 2), per
          // the quality audit's request), rather than a fixed value. Was
          // capped at 1.5, artificially softening the render on any
          // standard 2x-DPR display regardless of the source texture.
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
          camera={{ fov: DEFAULT_FOV, near: 0.1, far: 1100, position: [0, 0, 0] }}
          // A lost WebGL context used to leave a permanently dead canvas
          // with no explanation — the GPU process can be killed out from
          // under the page (driver reset, GPU memory pressure, the OS
          // reclaiming it) entirely independently of anything this code
          // does. preventDefault() asks the browser to restore it; if
          // nothing comes back within the grace window, fall back to the
          // honest error screen with its working retry rather than a
          // black rectangle.
          onCreated={({ gl }) => {
            registerRendererProbe(() => ({
              tex: gl.info.memory.textures,
              geo: gl.info.memory.geometries,
            }));
            const ctx = gl.getContext();
            const debugInfo = ctx.getExtension("WEBGL_debug_renderer_info");
            diag(
              "gl:created",
              `maxTex ${gl.capabilities.maxTextureSize} · aniso ${gl.capabilities.getMaxAnisotropy()} · ${
                debugInfo ? String(ctx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : "gpu unknown"
              }`
            );
            gl.domElement.addEventListener("webglcontextlost", (event) => {
              // preventDefault is what makes the browser try to hand the
              // context back instead of leaving the canvas dead forever.
              event.preventDefault();
              diag("gl:context-lost");
              setContextLost(true);
              contextLostTimerRef.current = setTimeout(() => setPhase("error"), CONTEXT_RESTORE_GRACE_MS);
            });
            gl.domElement.addEventListener("webglcontextrestored", () => {
              diag("gl:context-restored");
              clearTimeout(contextLostTimerRef.current);
              setContextLost(false);
              // Rebuild the canvas rather than trusting the old renderer to
              // pick itself back up. Everything it needs survives in React
              // state — the panorama THREE.Texture still holds its decoded
              // image — so a fresh renderer simply re-uploads it. A brief
              // flash is a far better outcome than a room that never comes
              // back.
              setCanvasKey((k) => k + 1);
            });
          }}
        >
          {/* Visible, non-black fallback — if the sphere ever fails to
              render for any reason, this reads as "something's off" (dark
              gray) rather than being indistinguishable from a total
              failure (pure black, same as the page's own backdrop). */}
          <color attach="background" args={["#111315"]} />
          <StudioErrorBoundary onError={() => setPhase("error")}>
            <StudioCanvasContent
              node={currentNode}
              texture={texture}
              domElement={canvasEl}
              cameraStateRef={cameraStateRef}
              controlsEnabled={controlsEnabled}
              reducedMotion={reducedMotion}
              debug={DEBUG}
              onDragStateChange={setDragging}
              onSelectHotspot={navigateToNode}
              onSelectArtwork={handleSelectArtwork}
              onSelectInfo={handleSelectInfo}
            />
          </StudioErrorBoundary>
        </Canvas>
      </div>

      {(phase === "intro" || phase === "revealing") && (
        <StudioIntro
          onEnter={handleEnter}
          ready={introReady}
          loadProgress={loadProgress}
          totalRooms={STUDIO_NODE_ORDER.length}
          backdropSrc={`/studio/thumbnails/${STUDIO_ENTRY_NODE_ID}-blur.webp`}
          roomCode={STUDIO_NODES[STUDIO_ENTRY_NODE_ID].room}
          roomName={STUDIO_NODES[STUDIO_ENTRY_NODE_ID].name}
          revealing={phase === "revealing"}
          revealDurationMs={REVEAL_DURATION_MS}
        />
      )}

      {(phase === "exploring" || phase === "transitioning") && (
        <>
          {/* The site's own real nav (Projets/Expertise/Journal/Studio +
              search) — self-positioning/fixed, safe to drop in directly
              without touching SiteChrome's per-route exclusion (which
              also governs /client and /admin). */}
          <Nav variant="fixed" flat />
          <StudioHUD
            totalRooms={STUDIO_NODE_ORDER.length}
            onToggleMenu={toggleMenu}
            menuOpen={menuOpen}
            cameraStateRef={cameraStateRef}
            handTrackingEnabled={handTrackingEnabled}
            onToggleHandTracking={() => setHandTrackingEnabled((v) => !v)}
            onReplayTour={() => setTourState("open")}
          />
          {/* Sitewide (any room), opt-in only — writes into the same
              cameraStateRef CameraController.tsx (inside the Canvas)
              already reads every frame, so no changes were needed there.
              Pinch-drag turns, hand depth zooms; `zoomEnabled` is the
              room's own, so hand zoom is allowed exactly where the wheel
              already is. */}
          <HandTrackingController
            cameraStateRef={cameraStateRef}
            enabled={handTrackingEnabled}
            zoomEnabled={currentNode.zoomEnabled}
          />
          {/* Room-scoped, not sitewide — the Lounge (p06) is the one room
              this was actually asked for. Self-positioned bottom-right
              (not part of StudioHUD's top-right row) per its own device
              styling. Mounting/unmounting it as the visitor enters/leaves
              is what stops playback automatically (see
              StudioMusicPlayer's own cleanup effect). */}
          {mapReady && (
            <StudioMap3D
              currentRoomId={currentNodeId}
              onNavigate={navigateToNode}
              isExpanded={mapExpanded}
              onExpand={() => setMapExpanded(true)}
              onCollapse={() => setMapExpanded(false)}
            />
          )}
          <StudioRoomPanel
            node={currentNode}
            roomIndex={roomIndex}
            totalRooms={STUDIO_NODE_ORDER.length}
            onPrev={() => prevNodeId && navigateToNode(prevNodeId)}
            onNext={() => nextNodeId && navigateToNode(nextNodeId)}
            prevDisabled={!canGoPrev}
            nextDisabled={!canGoNext}
          />
          <StudioRoomCarousel
            nodes={STUDIO_NODE_ORDER.map((id) => STUDIO_NODES[id])}
            activeId={currentNodeId}
            onSelectRoom={navigateToNode}
            // Available everywhere now, not just the Lounge. It keeps the
            // same slot in the room strip across a navigation, so React
            // reconciles it in place rather than remounting — which is what
            // lets a track carry on playing from one room into the next.
            trailing={musicDisabled ? undefined : <StudioMusicPlayer />}
          />
          <StudioFooter />
        </>
      )}

      {tourState === "open" && phase === "exploring" && <StudioTour onClose={closeTour} />}

      {contextLost && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
          style={{ zIndex: "var(--z-modal)", background: "rgba(5,5,5,0.9)" }}
        >
          <p className="font-display text-kov-bone uppercase text-sm tracking-widest">Reprise du rendu</p>
          <p className="text-kov-steel text-[10px] uppercase tracking-widest">La salle revient dans un instant</p>
        </div>
      )}

      <StudioNavigationOverlay active={navOverlayActive} />

      <StudioProjectPanel artwork={selectedArtwork} onClose={handleCloseArtworkPanel} />

      <StudioInfoPanel hotspot={selectedInfo} onClose={handleCloseInfoPanel} />

      <GlobalOverviewMenu open={menuOpen} onClose={closeMenu} />

      {/* Inert unless ?diag=1 was used in this tab. */}
      <StudioDiagnosticsPanel />
    </div>
  );
}
