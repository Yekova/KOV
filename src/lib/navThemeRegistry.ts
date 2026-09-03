// A plain module-level registry, not React state: Nav/GlobalMenuButton read
// it on every scroll frame (see useOnLightZone), and a Set of live DOM
// elements is cheaper to poll there than routing every light zone's mount
// state through context re-renders. Elements register themselves on mount
// via useLightZone and clean up on unmount, so this never outlives the
// page even though the module itself persists across client navigations.
const zones = new Set<Element>();

export function registerLightZone(el: Element) {
  zones.add(el);
}

export function unregisterLightZone(el: Element) {
  zones.delete(el);
}

export function getLightZones(): ReadonlySet<Element> {
  return zones;
}
