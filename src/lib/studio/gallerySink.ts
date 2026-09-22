"use client";

import { setGallerySink, type GalleryEvent, type GalleryEventProps } from "./galleryAnalytics";

// The end of the seam.
//
// trackGallery() has emitted events since the room was built and, with no
// sink attached, has been dropping every one of them in production. This
// attaches one — and it is the point at which a placement becomes
// something that can be reported on, which is the point at which it
// becomes something that can be sold a second year.
//
// Three decisions, all of which follow from the numbers ending up on an
// invoice:
//
//  - Nothing is written to the visitor's device. The session token lives
//    in a module variable and dies with the page. That is not a cookie and
//    not local storage, so it raises no consent question at all — and the
//    cost is worth stating in any report: a reload is a new session, so
//    "sessions" counts visits to the room, not people.
//  - Nothing personal is sent. No identifier, no page, no referrer: an
//    event is a room, an address and a verb.
//  - The batch goes to a server route which decides what is writable. The
//    client is the thing being measured; it does not get to write the
//    measurement.

const ENDPOINT = "/api/studio/gallery-events";
/** Matches the route's own cap. A walk through a gallery crosses a handful
 *  of proximity bands; anything larger is not a visit. */
const MAX_BATCH = 24;
/** Long enough that a walk past four stands is one request, short enough
 *  that leaving does not lose much. */
const FLUSH_MS = 4000;

interface Queued {
  event: GalleryEvent;
  slot: string;
}

let session = "";
let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function newSession() {
  // crypto.randomUUID is not available on every browser this site still
  // serves; the fallback is not security-sensitive, since this token is an
  // opaque grouping key and nothing more.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function send(beacon: boolean) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;

  const payload = JSON.stringify({ session, events: queue.slice(0, MAX_BATCH) });
  queue = queue.slice(MAX_BATCH);

  // Leaving the room, closing the tab, or navigating away: fetch is
  // cancelled with the document, sendBeacon is not. It is the only way the
  // last few events of a visit arrive at all.
  if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // A dropped measurement is not worth a console error in a visitor's
    // browser, and there is nothing useful to retry into.
  });
}

/** Starts a measured visit. Returns the teardown, which flushes whatever
 *  is still queued — so the last stand someone looked at counts. */
export function startGallerySink(): () => void {
  session = newSession();
  queue = [];

  setGallerySink((event: GalleryEvent, props: GalleryEventProps) => {
    const slot = typeof props.slot_id === "string" ? props.slot_id : null;
    // Only the four per-brand events carry an address, and only those are
    // worth anything to a sponsor. Room-level enter/exit is KOV's own
    // business and is not attributable to anyone's placement.
    if (!slot) return;

    queue.push({ event, slot });
    if (queue.length >= MAX_BATCH) {
      send(false);
      return;
    }
    if (!timer) timer = setTimeout(() => send(false), FLUSH_MS);
  });

  const onHide = () => {
    if (document.visibilityState === "hidden") send(true);
  };
  document.addEventListener("visibilitychange", onHide);

  return () => {
    document.removeEventListener("visibilitychange", onHide);
    send(true);
    setGallerySink(null);
    session = "";
    queue = [];
  };
}
