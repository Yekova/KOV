import { SPAWN, SPAWN_YAW } from "./galleryLayout";

// Where the visitor is, and which way they are facing.
//
// A module value rather than a ref threaded through props. Two reasons,
// and the second is the real one:
//
//  - Every frame, the player controller writes it and four or five stands
//    read it. Through React that is a state update per frame per reader;
//    through a shared object it is a field assignment.
//  - A component may not write into an object it was handed by its
//    parent — the compiler enforces it, and it is right to. Passing this
//    as a prop and mutating it is exactly the pattern that rule exists to
//    stop.
//
// There is one gallery and one visitor in it, so a single value is not a
// simplification of something plural. It is reset on arrival rather than
// recreated, because the controller's own effect is what defines where a
// visit starts.

export interface PlayerState {
  x: number;
  z: number;
  yaw: number;
}

export const playerState: PlayerState = { x: SPAWN[0], z: SPAWN[2], yaw: SPAWN_YAW };

/** Puts the visitor back at the entrance. Called when the room mounts, so
 *  leaving and coming back starts the visit again rather than resuming
 *  wherever the last one stopped. */
export function resetPlayerState() {
  playerState.x = SPAWN[0];
  playerState.z = SPAWN[2];
  playerState.yaw = SPAWN_YAW;
}
