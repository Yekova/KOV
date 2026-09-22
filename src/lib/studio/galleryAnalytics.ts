// Brand Gallery events.
//
// The seam every call site emits through. gallerySink.ts attaches the
// real one — a batched POST to a server route that decides what is
// writable — because these numbers end up on a sponsor's invoice and a
// browser that can write them is a browser that can inflate them.
//
// Nothing personal is ever in a payload: a brand id, a tier, a room. No
// visitor identifier, no dwell time tied to a person, no path.

export type GalleryEvent =
  | "brand_gallery_enter"
  | "brand_gallery_exit"
  | "brand_stand_view"
  | "brand_stand_interact"
  | "brand_video_play"
  | "brand_cta_click";

export interface GalleryEventProps {
  room_id: string;
  /** The address the event happened at, e.g. "n1-north-c". Present on the
   *  four per-brand events and absent on the two room-level ones — which
   *  is exactly the line between what a sponsor is owed a report on and
   *  what is KOV's own business. */
  slot_id?: string;
  brand_id?: string;
  tier?: string;
}

type Sink = (event: GalleryEvent, props: GalleryEventProps) => void;

let sink: Sink | null = null;

/** Point the events somewhere real. Called once, wherever an analytics
 *  provider is eventually mounted. */
export function setGallerySink(next: Sink | null) {
  sink = next;
}

export function trackGallery(event: GalleryEvent, props: GalleryEventProps) {
  if (sink) {
    sink(event, props);
    return;
  }
  // No sink, no silence: in development the events are visible so the
  // instrumentation can be checked before anything is plugged in. In
  // production an unwired event is simply dropped.
  if (process.env.NODE_ENV !== "production") {
    console.info("[gallery]", event, props);
  }
}
