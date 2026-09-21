"use client";

import { useEffect, useRef } from "react";

export interface MoveInput {
  forward: number;
  strafe: number;
  interact: boolean;
}

// Which keys are down, by physical position rather than by letter.
//
// event.code, not event.key: KeyW is the key above KeyS on every keyboard
// on earth, and on an AZERTY that key produces "z". Reading the letter
// would mean maintaining a layout table and still getting QWERTZ wrong.
// Reading the position makes ZQSD and WASD the same four keys, for free.
export function usePlayerControls(enabled: boolean) {
  const inputRef = useRef<MoveInput>({ forward: 0, strafe: 0, interact: false });
  const downRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) {
      downRef.current.clear();
      inputRef.current = { forward: 0, strafe: 0, interact: false };
      return;
    }

    const apply = () => {
      const down = downRef.current;
      const forward =
        (down.has("KeyW") || down.has("ArrowUp") ? 1 : 0) - (down.has("KeyS") || down.has("ArrowDown") ? 1 : 0);
      const strafe =
        (down.has("KeyD") || down.has("ArrowRight") ? 1 : 0) - (down.has("KeyA") || down.has("ArrowLeft") ? 1 : 0);
      inputRef.current = { forward, strafe, interact: down.has("KeyE") };
    };

    const onDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      downRef.current.add(event.code);
      // The arrows scroll the page and space scrolls it further; neither
      // should while the visitor is walking.
      if (event.code.startsWith("Arrow") || event.code === "Space") event.preventDefault();
      apply();
    };

    const onUp = (event: KeyboardEvent) => {
      downRef.current.delete(event.code);
      apply();
    };

    // Held keys survive a lost window otherwise, and the visitor comes back
    // to a room walking itself into a wall.
    const onBlur = () => {
      downRef.current.clear();
      apply();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  return inputRef;
}
