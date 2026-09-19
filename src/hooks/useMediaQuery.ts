"use client";

import { useCallback, useSyncExternalStore } from "react";

// Hydration reads this, so the client's first pass reproduces the server's
// markup exactly and React re-renders with the real answer instead of
// reporting a mismatch. Every caller treats false as its narrow case.
const getServerSnapshot = () => false;

// A breakpoint you can read in JS, that actually keeps up.
//
// Three components had grown their own copy of this, each reading
// window.innerWidth once in a lazy initialiser and never looking again — so
// rotating a phone or resizing a window left them on the wrong side of the
// breakpoint until something forced a remount. matchMedia's change event is
// the cheap way to watch one query: it fires when the answer changes, not on
// every pixel of a drag.
//
// useSyncExternalStore rather than useState + effect, because half the
// callers are inside prerendered pages: it is the one React primitive that
// knows the difference between "the first render of a hydrating tree" and
// "the first render of a component that mounted later", and answers each
// correctly. A lazy useState initialiser cannot — it reports the true
// viewport during hydration and so contradicts the HTML React is hydrating.
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
