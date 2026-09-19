import * as THREE from "three";
import { CARD_CUT, CARD_H, CARD_RADIUS, CARD_W, traceBadgeOutline, type PathSink } from "./badgeArt";

// The card's silhouette, as geometry.
//
// The reference component loads a card.glb and swaps its texture. This one
// builds the card instead, because the shape itself is part of the brief —
// rounded corners with a single cut one — and no amount of texture swapping
// changes a rectangle's outline. Building it also removes a binary asset and
// a loader from an already heavy page.

/** Card thickness. Deliberately no bevel: a bevelled ExtrudeGeometry pulls
 *  its end caps inward by bevelSize, and the flat faces laid on top would
 *  then overhang the body by exactly that much — a visible lip all the way
 *  round. At this thickness a square edge reads as a printed card anyway. */
const DEPTH = 0.05;

/** Feeds the shared outline tracer into a THREE.Shape, converting from the
 *  tracer's y-down canvas box to a y-up shape centred on the origin. */
class ShapeSink implements PathSink {
  constructor(private readonly shape: THREE.Shape) {}

  private x(v: number) {
    return v - CARD_W / 2;
  }

  private y(v: number) {
    return CARD_H / 2 - v;
  }

  moveTo(x: number, y: number) {
    this.shape.moveTo(this.x(x), this.y(y));
  }

  lineTo(x: number, y: number) {
    this.shape.lineTo(this.x(x), this.y(y));
  }

  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    this.shape.quadraticCurveTo(this.x(cx), this.y(cy), this.x(x), this.y(y));
  }
}

export function badgeShape(): THREE.Shape {
  const shape = new THREE.Shape();
  traceBadgeOutline(new ShapeSink(shape), CARD_W, CARD_H, CARD_RADIUS, CARD_CUT);
  shape.closePath();
  return shape;
}

/** A flat face carrying one of the painted textures.
 *
 *  ShapeGeometry's own UVs are world coordinates, not 0..1 — left alone, the
 *  texture would tile at one pixel per world unit. They are rewritten here
 *  against the bounding box, which is also what makes the art line up with
 *  the silhouette it was painted to fit. */
export function badgeFaceGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.ShapeGeometry(badgeShape(), 24);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return geometry;

  const w = box.max.x - box.min.x;
  const h = box.max.y - box.min.y;
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;

  for (let i = 0; i < position.count; i += 1) {
    uv.setXY(i, (position.getX(i) - box.min.x) / w, (position.getY(i) - box.min.y) / h);
  }
  uv.needsUpdate = true;

  return geometry;
}

/** The card's body: the same outline given thickness, centred on z = 0 so
 *  the two faces sit symmetrically at +/- DEPTH/2. */
export function badgeBodyGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.ExtrudeGeometry(badgeShape(), {
    depth: DEPTH,
    bevelEnabled: false,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -DEPTH / 2);
  return geometry;
}

/** Where each face sits. The hair of clearance stops the face and the body's
 *  end cap from z-fighting. */
export const FACE_Z = DEPTH / 2 + 0.0012;
