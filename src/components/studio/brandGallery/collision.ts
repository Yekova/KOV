import type { GalleryBox } from "./galleryLayout";

// A circle against boxes, on the plane the visitor is standing on.
//
// Plan-view collision, but no longer plan-only: every box now declares the
// height it occupies, and a box the visitor's body does not reach is not
// in their way. That single test is what makes two levels work — the
// mezzanine's glass guard is a wall on the ring and thin air on the ground
// floor underneath it, and it is one box either way.
//
// Resolution is minimum-translation: push out along whichever axis is
// shallowest, which is what makes a corner feel like a corner rather than
// a trap. Two passes, because pushing out of one box can push into
// another — a corner between two walls is exactly that case.

/** How tall the visitor is, for deciding what is in their way. Their feet
 *  start a little above the floor so a deck's own lip never counts. */
const BODY_BOTTOM = 0.12;
const BODY_TOP = 1.75;

interface Resolved {
  x: number;
  z: number;
}

function resolveOnce(x: number, z: number, y: number, radius: number, colliders: GalleryBox[]): Resolved {
  let px = x;
  let pz = z;

  const feet = y + BODY_BOTTOM;
  const head = y + BODY_TOP;

  for (const box of colliders) {
    const boxBottom = box.position[1] - box.size[1] / 2;
    const boxTop = box.position[1] + box.size[1] / 2;
    // Nothing above the head or below the feet is in the way.
    if (boxTop <= feet || boxBottom >= head) continue;

    const halfW = box.size[0] / 2 + radius;
    const halfD = box.size[2] / 2 + radius;
    const dx = px - box.position[0];
    const dz = pz - box.position[2];

    if (Math.abs(dx) >= halfW || Math.abs(dz) >= halfD) continue;

    // Inside the inflated box: leave by the nearest face.
    const overlapX = halfW - Math.abs(dx);
    const overlapZ = halfD - Math.abs(dz);
    if (overlapX < overlapZ) {
      px = box.position[0] + Math.sign(dx || 1) * halfW;
    } else {
      pz = box.position[2] + Math.sign(dz || 1) * halfD;
    }
  }

  return { x: px, z: pz };
}

export function resolveCollisions(
  x: number,
  z: number,
  y: number,
  radius: number,
  colliders: GalleryBox[]
): Resolved {
  const first = resolveOnce(x, z, y, radius, colliders);
  return resolveOnce(first.x, first.z, y, radius, colliders);
}
