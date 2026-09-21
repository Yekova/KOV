"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const SRC = "/work/liquid-16x9.webp";

/** How big the brush is, as a fraction of the band's width. Scaled rather
 *  than fixed so the gesture feels the same on a phone-width band and on a
 *  1500px one. */
const BRUSH = 0.115;
/** How fast the trail closes back over. Per frame, at 60fps — low enough
 *  that a slow sweep leaves a readable path behind it, high enough that the
 *  band is black again a couple of seconds after the cursor leaves. */
const FADE = 0.028;
/** The mask is a fraction of the canvas. A trail is soft by definition, so
 *  resolving it at full size is paying for detail the blur throws away. */
const MASK_SCALE = 0.2;

// The opening band: an image that is only there where you have been.
//
// Black with the picture barely under it, and the cursor develops it —
// a wiped surface rather than a hover state. Everything is one canvas and
// one mask: the mask accumulates soft white where the pointer passes and
// loses a little alpha every frame, and the picture is composited through
// it. No blend modes on DOM nodes, no filter, nothing the compositor has
// to re-rasterise per frame.
//
// It is decorative and says so. On a touch screen there is no cursor to
// follow, and under prefers-reduced-motion a trail that fades is motion —
// both get the picture plainly, at the opacity the band uses as its floor.
export function LiquidReveal() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [touched, setTouched] = useState(false);

  const coarse = useMediaQuery("(hover: none)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const still = coarse || reduced;

  useEffect(() => {
    if (still) return;

    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d");
    if (!mctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let brush = 40;

    // Where the pointer was last frame, so a fast sweep draws a stroke
    // rather than a row of dots at whatever rate the mouse reports.
    let last: { x: number; y: number } | null = null;
    let next: { x: number; y: number } | null = null;

    let frame = 0;
    let idle = 0;
    let running = false;
    let painted = false;
    // The hint is retired once, not on every pointer event: setState on
    // pointermove is a React render per mouse sample.
    let hinted = false;

    const image = new Image();
    let loaded = false;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      mask.width = Math.max(48, Math.round(width * MASK_SCALE));
      mask.height = Math.max(27, Math.round(height * MASK_SCALE));
      brush = Math.max(18, mask.width * BRUSH);
      // A resize invalidates the trail: the mask was drawn in the old
      // box's coordinates and stretching it would smear the path.
      mctx.clearRect(0, 0, mask.width, mask.height);
      last = null;
    };

    const dab = (x: number, y: number) => {
      const gradient = mctx.createRadialGradient(x, y, 0, x, y, brush);
      gradient.addColorStop(0, "rgba(255,255,255,0.5)");
      gradient.addColorStop(0.55, "rgba(255,255,255,0.22)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      mctx.fillStyle = gradient;
      mctx.beginPath();
      mctx.arc(x, y, brush, 0, Math.PI * 2);
      mctx.fill();
    };

    const draw = () => {
      // Advance the trail: fade what is there, then lay down the segment
      // the pointer covered since the last frame.
      mctx.globalCompositeOperation = "destination-out";
      mctx.fillStyle = `rgba(0,0,0,${FADE})`;
      mctx.fillRect(0, 0, mask.width, mask.height);
      mctx.globalCompositeOperation = "source-over";

      if (next) {
        // The mask is a straight scale of the box, so a point maps by
        // ratio — taken from the real dimensions rather than from the
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
        ctx.drawImage(image, 0, 0, width, height);
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

    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      next = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (!hinted) {
        hinted = true;
        setTouched(true);
      }
      start();
    };

    const onLeave = () => {
      last = null;
      next = null;
    };

    image.decoding = "async";
    image.onload = () => {
      loaded = true;
    };
    image.src = SRC;

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      image.onload = null;
    };
  }, [still]);

  return (
    <div className="kov-liq" aria-hidden="true">
      <div ref={hostRef} className={`kov-liq__frame${still ? " is-still" : ""}`}>
        {/* The floor state, always there: the picture is under the surface,
            not absent from it. Same file as the canvas paints, so the
            reveal costs no second download. */}
        <div className="kov-liq__base" style={{ backgroundImage: `url(${SRC})` }} />
        {!still && <canvas ref={canvasRef} className="kov-liq__canvas" />}
        {!still && (
          <p className={`kov-liq__hint${touched ? " is-gone" : ""}`}>Déplacez le curseur</p>
        )}
      </div>
    </div>
  );
}
