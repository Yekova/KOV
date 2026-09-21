// Brand Gallery events.
//
// The brief lists PostHog; this project does not have it — checked, not
// assumed: there is no posthog dependency and no provider anywhere in src.
// So this is the seam rather than the integration. Every call site emits
// through here, and wiring a real sink later is one function body.
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
