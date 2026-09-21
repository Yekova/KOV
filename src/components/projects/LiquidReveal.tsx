"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const SRC = "/work/liquid-16x9.webp";

/** The lit disc, in pixels of radius, clamped so it is the same gesture
 *  on a laptop and on a wide monitor. */
const RADIUS = { min: 150, max: 260, of: 0.2 };

// The page's ground: black, except directly under the cursor.
//
// Not a picture in a frame and not a trail. One soft disc locked to the
// pointer — where the cursor is, the image; everywhere else, and the
// moment the cursor leaves, nothing. There is no history, no decay and
// no easing, because all three are ways of leaving the picture on screen
// after the cursor has gone.
//
// It follows that there is no animation loop either. A frame is drawn
// when the pointer moves and at no other time, so a still mouse costs
// exactly nothing, and each frame touches a box the size of the disc
// rather than the viewport: clear where it was, paint where it is.
//
// z-index -1 rather than a positive layer with the content pushed above
// it: a negative-index child paints after its ancestors' backgrounds and
// before any in-flow content, which is the layer a background belongs in
// — and it means not one rule of the page's own stacking has to change.
//
// A touch screen has no cursor, so it gets no ground. The image is
// scenery for a gesture that does not exist there, and showing it anyway
// is showing the one thing this was asked not to show.
export function LiquidReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coarse = useMediaQuery("(hover: none)");

  useEffect(() => {
    if (coarse) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The disc is built here and stamped onto the page layer whole.
    //
    // It would look like the obvious thing to clip the visible canvas to
    // the disc's box and composite in place — but the canvas drawing
    // model clips the *source* and then composites, so `source-in` would
    // still clear every pixel outside that box across the whole layer.
    // Off screen, the operation means what it says, and the stamp lands
    // with a plain source-over.
    const sprite = document.createElement("canvas");
    const sctx = sprite.getContext("2d");
    if (!sctx) return;

    let width = 0;
    let height = 0;
    let radius = RADIUS.min;

    // The box the last frame painted, so the next one knows what to
    // clear. A full-viewport clear every frame is the one cost this
    // design does not need to pay.
    let dirty: [number, number, number, number] | null = null;
    let at: { x: number; y: number } | null = null;
    let frame = 0;

    const image = new Image();
    let loaded = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      radius = Math.max(RADIUS.min, Math.min(RADIUS.max, Math.min(width, height) * RADIUS.of));

      sprite.width = Math.round(radius * 2 * dpr);
      sprite.height = Math.round(radius * 2 * dpr);
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dirty = null;
    };

    /** The picture, sized to cover the viewport. It is 16:9 and a window
     *  rarely is, so one axis always overflows — centred, like any other
     *  background-size: cover. */
    const cover = () => {
      const ratio = (image.naturalWidth || 16) / (image.naturalHeight || 9);
      const wide = width / height > ratio;
      const w = wide ? width : height * ratio;
      const h = wide ? width / ratio : height;
      return { x: (width - w) / 2, y: (height - h) / 2, w, h };
    };

    const draw = () => {
      frame = 0;

      if (dirty) {
        ctx.clearRect(dirty[0], dirty[1], dirty[2], dirty[3]);
        dirty = null;
      }
      if (!at || !loaded) return;

      const { x, y } = at;
      const size = radius * 2;
      const ox = x - radius;
      const oy = y - radius;

      // The disc: a soft mask, then the picture kept only where the mask
      // is. The picture is drawn in page coordinates offset into the
      // sprite, so what appears under the cursor is the part of the
      // background that is actually there — the ground does not move
      // with the pointer, only the window onto it does.
      sctx.clearRect(0, 0, size, size);
      const gradient = sctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.5, "rgba(255,255,255,0.96)");
      gradient.addColorStop(0.82, "rgba(255,255,255,0.42)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      sctx.fillStyle = gradient;
      sctx.fillRect(0, 0, size, size);

      sctx.globalCompositeOperation = "source-in";
      const picture = cover();
      sctx.drawImage(image, picture.x - ox, picture.y - oy, picture.w, picture.h);
      sctx.globalCompositeOperation = "source-over";

      ctx.drawImage(sprite, ox, oy, size, size);

      dirty = [ox, oy, size, size];
    };

    // One draw per frame at most, whatever rate the mouse reports at.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    // The layer is fixed, so viewport coordinates are its coordinates —
    // no rect to measure, and it keeps up while the page scrolls under it.
    const onMove = (event: PointerEvent) => {
      at = { x: event.clientX, y: event.clientY };
      schedule();
    };

    const clear = () => {
      at = null;
      schedule();
    };

    // Out of the window entirely: relatedTarget is null only when the
    // pointer has left the document, not when it crosses between two
    // elements inside it.
    const onOut = (event: PointerEvent) => {
      if (!event.relatedTarget) clear();
    };

    image.decoding = "async";
    image.onload = () => {
      loaded = true;
      schedule();
    };
    image.src = SRC;

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onOut);
    // A tab left with the cursor mid-screen comes back with the disc
    // still painted where the mouse no longer is.
    window.addEventListener("blur", clear);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("blur", clear);
      image.onload = null;
    };
  }, [coarse]);

  if (coarse) return null;

  return <canvas ref={canvasRef} className="kov-liq" aria-hidden="true" />;
}
