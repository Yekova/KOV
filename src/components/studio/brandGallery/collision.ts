import type { GalleryBox } from "./galleryLayout";

// Collision, kept to what this room actually needs.
//
// @react-three/rapier is already in the project — it arrived for the badge
// lanyard — and it is deliberately not used here. It compiles to a 2 MB
// chunk that /badge fetches on demand and the studio currently never
// touches; pulling a WASM physics engine into a room made of axis-aligned
// boxes would cost every visitor that download to solve a problem that is
// forty lines of arithmetic. The brief's own instruction is reliability
// over physics, and this is both.
//
// The visitor is a circle in plan view. Gravity, stairs and slopes do not
// exist in this room, so nothing is simulated on y at all.

const EPSILON = 1e-4;

/** Pushes a circle out of one box, on whichever axis it has penetrated
 *  least — the standard minimum-translation resolution, which is what
 *  makes sliding along a wall feel right instead of sticking. */
function resolveOne(
  x: number,
  z: number,
  radius: number,
  box: GalleryBox
): { x: number; z: number } | null {
  const [cx, , cz] = box.position;
  const halfW = box.size[0] / 2 + radius;
  const halfD = box.size[2] / 2 + radius;

  const dx = x - cx;
  const dz = z - cz;
  const overlapX = halfW - Math.abs(dx);
  const overlapZ = halfD - Math.abs(dz);

  if (overlapX <= 0 || overlapZ <= 0) return null;

  if (overlapX < overlapZ) {
    return { x: cx + Math.sign(dx || 1) * (halfW + EPSILON), z };
  }
  return { x, z: cz + Math.sign(dz || 1) * (halfD + EPSILON) };
}

/** Resolves a proposed position against every collider.
 *
 *  Two passes, not one: pushing out of a wall can push into a pier, and a
 *  single pass would leave the visitor inside it. Two settles every corner
 *  this room has, and a corner it cannot settle would be an architectural
 *  problem rather than one to fix with a third pass. */
export function resolveCollisions(
  x: number,
  z: number,
  radius: number,
  colliders: readonly GalleryBox[]
): { x: number; z: number } {
  let px = x;
  let pz = z;

  for (let pass = 0; pass < 2; pass += 1) {
    let moved = false;
    for (const box of colliders) {
      const hit = resolveOne(px, pz, radius, box);
      if (hit) {
        px = hit.x;
        pz = hit.z;
        moved = true;
      }
    }
    if (!moved) break;
  }

  return { x: px, z: pz };
}
