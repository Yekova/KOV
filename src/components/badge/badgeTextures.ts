import * as THREE from "three";
import {
  BAND_H,
  BAND_W,
  badgeAssetsReady,
  paintBadgeFace,
  paintLanyardBand,
  TEX_H,
  TEX_W,
  type BadgeFace,
} from "./badgeArt";

// The thin THREE layer over badgeArt's painter.
//
// Kept apart from the painting itself so that importing the badge artwork
// does not import three.js. Only the 3D scene reaches this file, and the 3D
// scene is already lazy.

/** Wraps a canvas in a texture, painting once immediately so the first frame
 *  is never blank and again once the real fonts and the wordmark arrive. */
function liveCanvasTexture(
  width: number,
  height: number,
  paint: (canvas: HTMLCanvasElement) => void
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  paint(canvas);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  void badgeAssetsReady().then(() => {
    paint(canvas);
    texture.needsUpdate = true;
  });

  return texture;
}

export function createBadgeFaceTexture(face: BadgeFace): THREE.CanvasTexture {
  return liveCanvasTexture(TEX_W, TEX_H, (canvas) => paintBadgeFace(canvas, face));
}

export function createLanyardTexture(): THREE.CanvasTexture {
  const texture = liveCanvasTexture(BAND_W, BAND_H, paintLanyardBand);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
