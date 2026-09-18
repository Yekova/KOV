"use client";

import { useEffect, useRef } from "react";
import "./SectionVeil.css";

// A black block over the page's animated background, with a hole in it that
// follows the cursor.
//
// LineWaves runs fixed behind the whole homepage. Some sections want to sit
// on black rather than on a moving shader — text is easier to read, and the
// contrast between a quiet section and a live one is worth having. But
// covering the shader entirely also throws away the thing that makes the
// page feel alive, so the veil is masked: opaque everywhere, thinned to a
// soft disc under the pointer. You glimpse what is underneath rather than
// seeing it.
//
// The reveal is deliberately partial — the mask bottoms out around 40%
// rather than 0%. A full hole would put a moving shader directly behind
// running text wherever the cursor happened to be, which is the readability
// problem these sections were given a scrim for in the first place.
//
// Painting order is the trap, and it is why this is absolutely positioned
// with no z-index: a positioned element with z-index auto paints in step 8,
// ABOVE ordinary in-flow content in step 4. So the section's content has to
// live in its own `relative` wrapper placed after this in the DOM — the same
// arrangement WorkGallery already uses for its rule grid. A negative z-index
// would drop it into the same band as --z-canvas, behind the shader it is
// supposed to cover.
export function SectionVeil() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No halo without a real pointer, and none under reduced motion: it
    // would be a large element repainting continuously for an effect that
    // nobody can aim and some people asked not to see.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let nextX = 0;
    let nextY = 0;
    let listening = false;

    function flush() {
      frame = 0;
      el?.style.setProperty("--halo-x", `${nextX}px`);
      el?.style.setProperty("--halo-y", `${nextY}px`);
    }

    function handleMove(event: PointerEvent) {
      const box = el?.getBoundingClientRect();
      if (!box) return;
      nextX = event.clientX - box.left;
      nextY = event.clientY - box.top;
      // One mask write per frame. Masking a section-sized element is the
      // expensive part of this effect; doing it per pointer event rather
      // than per frame is what would make it stutter.
      if (!frame) frame = requestAnimationFrame(flush);
    }

    // The listener only exists while the section is on screen. Four of these
    // on one page, all tracking the pointer through the whole scroll, would
    // be four repaints per frame for three sections nobody is looking at.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === listening) return;
        listening = entry.isIntersecting;
        if (listening) {
          window.addEventListener("pointermove", handleMove, { passive: true });
          el?.classList.add("kov-veil--live");
        } else {
          window.removeEventListener("pointermove", handleMove);
          el?.classList.remove("kov-veil--live");
        }
      },
      { rootMargin: "10% 0px" }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", handleMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="kov-veil" />;
}
