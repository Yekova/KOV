"use client";

import { useEffect, type RefObject } from "react";

// Attaches a video's `src` only once it is close to the viewport, instead of
// at mount.
//
// Two separate wins, and the second one is the bigger:
//
//  1. A below-the-fold clip no longer competes with the page's own critical
//     resources. The `poster` keeps showing until the data actually lands,
//     so the frame looks identical the whole time and nothing shifts.
//
//  2. A `display:none` element has no box, so an IntersectionObserver never
//     reports it as intersecting — which means the breakpoint variant that
//     CSS has hidden never downloads at all. Rendering both a desktop and a
//     mobile <video> and letting CSS pick between them is the normal way to
//     write that, but `display:none` does NOT stop a media element from
//     loading: a phone was downloading the desktop variant in full, on top
//     of its own.
//
// Pass the `src` here rather than as a JSX prop — React must not be the one
// to set the attribute, or the load starts at mount regardless.
export function useLazyVideoSrc(
  ref: RefObject<HTMLVideoElement | null>,
  src: string,
  // Generous by default: a scroll-scrubbed clip has to be buffered *before*
  // the viewer reaches it, not as they arrive.
  rootMargin = "250% 0px"
) {
  useEffect(() => {
    const video = ref.current;
    if (!video || video.getAttribute("src") === src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        video.src = src;
      },
      { rootMargin }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [ref, src, rootMargin]);
}
