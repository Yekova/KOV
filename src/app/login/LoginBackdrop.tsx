"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** How far the room drifts from centre, in pixels. */
const DRIFT = 26;
/** Resting zoom. The image is held slightly larger than the viewport at
 *  all times so the drift can never expose an edge: at 26px of travel this
 *  leaves about 70px of slack on a 1920 screen. */
const ZOOM_REST = 1.07;
/** What the far corners add to it. This is the "zoom" half of the effect —
 *  the room opens a little as you move away from the middle of it. */
const ZOOM_RANGE = 0.035;
/** Per frame, toward the target. The room follows the cursor; it does not
 *  snap to it. */
const EASE = 0.075;

// The room behind everything.
//
// Fixed rather than absolute inside <main>, for two reasons. It is what
// makes the image the ground under the footer as well as under the form —
// the footer is a sibling of <main> and paints over nothing otherwise. And
// a fixed layer does not scroll, so the image stays still while the page
// moves over it, which is the read a photograph of a room should have.
export function LoginBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarse = useMediaQuery("(hover: none)");
  const still = reduced || coarse;

  useEffect(() => {
    if (still) return;
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    // Target, then current: the gap between them is the drift.
    let tx = 0;
    let ty = 0;
    let td = 0;
    let cx = 0;
    let cy = 0;
    let cd = 0;

    const tick = () => {
      frame = 0;
      cx += (tx - cx) * EASE;
      cy += (ty - cy) * EASE;
      cd += (td - cd) * EASE;
      el.style.transform = `scale(${ZOOM_REST + cd * ZOOM_RANGE}) translate3d(${cx}px, ${cy}px, 0)`;
      // Stops on its own once it has arrived, rather than running a frame
      // loop for the whole visit.
      if (Math.abs(tx - cx) > 0.08 || Math.abs(ty - cy) > 0.08 || Math.abs(td - cd) > 0.001) {
        frame = requestAnimationFrame(tick);
      }
    };

    const onMove = (event: PointerEvent) => {
      // -1..1 from the centre of the window, then inverted: the room moves
      // against the cursor, which is what reads as depth rather than as
      // the image being dragged.
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      tx = -nx * DRIFT;
      ty = -ny * DRIFT;
      td = Math.min(1, Math.hypot(nx, ny));
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [still]);

  return (
    <div aria-hidden="true" className="fixed inset-0" style={{ zIndex: 0, pointerEvents: "none" }}>
      <div
        ref={ref}
        className="absolute inset-0"
        style={{
          transform: `scale(${ZOOM_REST})`,
          transformOrigin: "center",
          willChange: still ? undefined : "transform",
        }}
      >
        {/* priority: this is the page's only image and it is the page. */}
        <Image
          src="/kov/login/hall.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center 60%" }}
        />
      </div>

      {/* Two scrims rather than one flat veil: a vertical one so the
          statement at the top and the corner mark at the bottom each sit on
          something, and a horizontal one that deepens toward the card. The
          photograph keeps its own light through the middle, which is the
          whole reason to use a photograph. The bottom stop is the deepest
          of the four, because the footer's own text lands there. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,10,0.74) 0%, rgba(8,8,10,0.26) 32%, rgba(8,8,10,0.34) 58%, rgba(8,8,10,0.88) 100%), linear-gradient(90deg, rgba(8,8,10,0.66) 0%, rgba(8,8,10,0.10) 42%, rgba(8,8,10,0.56) 100%)",
        }}
      />
    </div>
  );
}
