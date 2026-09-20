// Stopping the page behind an overlay.
//
// Harder than it looks on this site, because two things scroll: the browser,
// and Lenis. Setting overflow:hidden alone leaves Lenis happily animating the
// page behind a modal, and calling lenis.stop() alone leaves the native
// scrollbar working for anyone in reduced motion, where Lenis never mounts.
// Both are needed, so both live here rather than being half-remembered at
// each call site.
//
// Locks are counted. Two overlays open at once and the first one closing must
// not hand the page back while the second is still up.

interface Scroller {
  stop: () => void;
  start: () => void;
}

let scroller: Scroller | null = null;
let locks = 0;

/** Called by SmoothScroll once Lenis exists. Returns its own teardown. */
export function registerScroller(instance: Scroller): () => void {
  scroller = instance;
  return () => {
    if (scroller === instance) scroller = null;
  };
}

export function lockScroll(): void {
  locks += 1;
  if (locks > 1) return;

  scroller?.stop();

  // Removing the scrollbar reflows the whole page a few pixels wider, which
  // reads as the content jumping sideways the moment a modal opens. Holding
  // its width back as padding keeps everything exactly where it was.
  const gutter = window.innerWidth - document.documentElement.clientWidth;
  if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
  document.documentElement.style.overflow = "hidden";
}

export function unlockScroll(): void {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;

  document.documentElement.style.overflow = "";
  document.body.style.paddingRight = "";
  scroller?.start();
}
