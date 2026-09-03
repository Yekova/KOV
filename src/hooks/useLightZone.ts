"use client";

import { useEffect, type RefObject } from "react";
import { registerLightZone, unregisterLightZone } from "@/lib/navThemeRegistry";

// Marks an element as a light-background area — Nav/GlobalMenuButton read
// this registry (useOnLightZone) to know when to flip their bone-on-dark
// text/logo to black so they stay legible over it. `enabled` lets a caller
// with an optional/placeholder image (dark until a real screenshot is
// supplied) only register once there's actually something light to flag.
export function useLightZone(ref: RefObject<Element | null>, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    registerLightZone(el);
    return () => unregisterLightZone(el);
  }, [ref, enabled]);
}
