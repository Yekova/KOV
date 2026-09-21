import type { Brand } from "@/lib/studio/brands";

// The contract between the room and everything that fills it.
//
// Small on purpose: the scene needs to know who is in it and what to do
// when someone is approached or left, and nothing else. Anything richer
// would be the scene knowing about Supabase.

export interface GalleryOccupant {
  brand: Brand;
}

export interface GalleryCallbacks {
  /** A stand was activated — clicked, or E'd from within reach. */
  onInteract: (brand: Brand) => void;
  /** The visitor stepped into or out of the exit threshold. */
  onExitZone: (near: boolean) => void;
  /** Pointer lock was taken or released. */
  onLockChange: (locked: boolean) => void;
}
