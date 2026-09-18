"use client";

import { useEffect, useState } from "react";

// A breakpoint you can read in JS, that actually keeps up.
//
// Three components had grown their own copy of this, each reading
// window.innerWidth once in a lazy initialiser and never looking again — so
// rotating a phone or resizing a window left them on the wrong side of the
// breakpoint until something forced a remount. matchMedia's change event is
// the cheap way to watch one query: it fires when the answer changes, not on
// every pixel of a drag.
//
// The initial value is still read during render rather than in an effect, so
// there is no frame of wrong layout before the first paint. On the server it
// resolves false, which every caller treats as its narrow case.
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return matches;
}
