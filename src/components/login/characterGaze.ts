// Shared, mutable gaze state read imperatively inside useFrame — avoids
// pushing 60fps updates through React state. `override` lets other UI
// (e.g. LoginForm field focus) bias where the character looks without
// wiring props through the server-rendered page.
export type GazeOverride = { yaw: number; pitch: number } | null;

export const gazeState = {
  pointerX: 0,
  pointerY: 0,
  override: null as GazeOverride,
  reducedMotion: false,
  finePointer: true,
};

export function setGazeOverride(override: GazeOverride) {
  gazeState.override = override;
}
