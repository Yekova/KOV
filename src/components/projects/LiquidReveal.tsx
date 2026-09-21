"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const SRC = "/work/liquid-16x9.webp";

/** How big the brush is, as a fraction of the viewport width. Scaled
 *  rather than fixed so the gesture feels the same on a laptop and on a
 *  wide monitor. */
const BRUSH = 0.1;
/** How fast the trail closes back over. Per frame, at 60fps — low enough
 *  that a sweep leaves a readable path behind it, high enough that the
 *  page is black again a couple of seconds after the pointer stops. */
const FADE = 0.022;
/** The mask is a fraction of the viewport. A trail is soft by definition,
 *  so resolving it at full size is paying for detail the blur throws
 *  away — and at full size this would be a 4-megapixel clear per frame. */
const MASK_SCALE = 0.2;

// The page's ground: an image that is only there where the cursor has
// been.
//
// Not a picture in a frame — the frame was the mistake. This is a fixed
// layer the size of the viewport, sitting between the page's black and
// everything written on it, and nothing of it shows until the pointer
// moves. One canvas and one mask: the mask accumulates soft white where
// the pointer passes and loses a little alpha every frame, and the
// picture is composited through it.
//
// z-index -1 rather than a positive value with the content pushed above
// it: a negative-index child paints after its ancestors' backgrounds and
// before any in-flow content, which is exactly the layer a background
// belongs in — and it means not one rule of the page's own stacking has
// to change.
//
// On a touch screen there is no cursor to follow, and under
// prefers-reduced-motion a trail that fades is motion. Both get the
// picture as a still ground, low enough to read as texture.
export function LiquidReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const coarse = useMediaQuery("(hover: none)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const still = coarse || reduced;

  useEffect(() => {
    if (still) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d");
    if (!mctx) return;

    let width = 0;
    let height = 0;
    let brush = 40;

    // Where the pointer was last frame, so a fast sweep draws a stroke
    // rather than a row of dots at whatever rate the mouse reports.
    let last: { x: number; y: number } | null = null;
    let next: { x: number; y: number } | null = null;

    let frame = 0;
    let idle = 0;
    let running = false;
    let painted = false;

    const image = new Image();
    let loaded = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      mask.width = Math.max(64, Math.round(width * MASK_SCALE));
      mask.height = Math.max(48, Math.round(height * MASK_SCALE));
      brush = Math.max(20, mask.width * BRUSH);
      // A resize invalidates the trail: the mask was drawn in the old
      // viewport's coordinates and stretching it would smear the path.
      mctx.clearRect(0, 0, mask.width, mask.height);
      last = null;
    };

    const dab = (x: number, y: number) => {
      const gradient = mctx.createRadialGradient(x, y, 0, x, y, brush);
      gradient.addColorStop(0, "rgba(255,255,255,0.55)");
      gradient.addColorStop(0.55, "rgba(255,255,255,0.24)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      mctx.fillStyle = gradient;
      mctx.beginPath();
      mctx.arc(x, y, brush, 0, Math.PI * 2);
      mctx.fill();
    };

    /** The picture, sized to cover the viewport. It is 16:9 and a window
     *  rarely is, so one axis always overflows — centred, like any other
     *  background-size: cover. */
    const cover = () => {
      const ratio = (image.naturalWidth || 16) / (image.naturalHeight || 9);
      const w = width / height > ratio ? width : height * ratio;
      const h = width / height > ratio ? width / ratio : height;
      return { x: (width - w) / 2, y: (height - h) / 2, w, h };
    };

    const draw = () => {
      // Advance the trail: fade what is there, then lay down the segment
      // the pointer covered since the last frame.
      mctx.globalCompositeOperation = "destination-out";
      mctx.fillStyle = `rgba(0,0,0,${FADE})`;
      mctx.fillRect(0, 0, mask.width, mask.height);
      mctx.globalCompositeOperation = "source-over";

      if (next) {
        // The mask is a straight scale of the viewport, so a point maps
        // by ratio — taken from the real dimensions rather than from the
        // nominal scale, which rounding has already moved off.
        const to = { x: (next.x / width) * mask.width, y: (next.y / height) * mask.height };
        const from = last ?? to;
        const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (brush * 0.35)));
        for (let i = 1; i <= steps; i += 1) {
          dab(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps);
        }
        last = to;
        next = null;
        idle = 0;
        painted = true;
      } else {
        idle += 1;
      }

      ctx.clearRect(0, 0, width, height);
      if (loaded && painted) {
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(mask, 0, 0, width, height);
        ctx.globalCompositeOperation = "source-in";
        const box = cover();
        ctx.drawImage(image, box.x, box.y, box.w, box.h);
        ctx.globalCompositeOperation = "source-over";
      }

      // Stopped meaning stopped: once the pointer has been still long
      // enough for the trail to have faded out, the loop ends rather than
      // running a clear over a blank canvas for the rest of the visit.
      if (idle > 1 / FADE + 30) {
        running = false;
        painted = false;
        last = null;
        ctx.clearRect(0, 0, width, height);
        return;
      }
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      idle = 0;
      frame = requestAnimationFrame(draw);
    };

    // The layer is fixed, so viewport coordinates are its coordinates —
    // no rect to measure, and it keeps up while the page scrolls under it.
    const onMove = (event: PointerEvent) => {
      next = { x: event.clientX, y: event.clientY };
      start();
    };

    // A pointer that leaves the window and comes back somewhere else
    // would otherwise draw the straight line between the two.
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) last = null;
    };

    image.decoding = "async";
    image.onload = () => {
      loaded = true;
    };
    image.src = SRC;

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onOut);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      image.onload = null;
    };
  }, [still]);

  if (still) {
    return <div className="kov-liq kov-liq--still" aria-hidden="true" style={{ backgroundImage: `url(${SRC})` }} />;
  }

  return <canvas ref={canvasRef} className="kov-liq" aria-hidden="true" />;
}
