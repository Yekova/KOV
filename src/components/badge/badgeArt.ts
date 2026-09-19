import { BADGE_CODE } from "@/lib/easterEgg";

// The badge artwork, painted on a 2D canvas.
//
// One painter serves two consumers: the 3D card's texture, and the flat card
// shown to anyone who asked their OS for reduced motion. That is why the
// painter clips to the badge outline itself rather than leaving the silhouette
// to the geometry — the DOM version has no geometry to be cut by, and two
// drawings of the same badge would drift apart within a week.
//
// Nothing here imports three. The flat badge is part of the route's eager
// bundle, and three.js is 370 KB that a visitor who asked for reduced motion
// would otherwise download to look at a picture. The THREE.CanvasTexture
// wrappers live next door in badgeTextures.ts, which only the 3D scene loads.

/** The card, in world units. These are the reference component's own collider
 *  half-extents doubled (0.8 x 1.125), so the physics and the art agree
 *  without either having to know about the other. */
export const CARD_W = 1.6;
export const CARD_H = 2.25;
/** Corner radius, and the single chamfered corner — bottom-right. */
export const CARD_RADIUS = 0.17;
export const CARD_CUT = 0.46;

const PX_PER_UNIT = 400;
export const TEX_W = Math.round(CARD_W * PX_PER_UNIT); // 640
export const TEX_H = Math.round(CARD_H * PX_PER_UNIT); // 900

const BLACK = "#0a0a0a";
const BONE = "#e7e7e5";
const RED = "#e31e24";

/** Printed on both faces of the badge.
 *
 *  The brief said kov-agency.com; this is .site, which is the domain the
 *  codebase actually ships — layout.tsx, sitemap.ts and robots.ts all declare
 *  https://kov-agency.site as the canonical host. Printing an address on a
 *  physical-looking badge that does not resolve would be worse than printing
 *  a plain one, so it says the domain that works. If .com is owned and
 *  redirects, change this one line. */
const BADGE_URL = "kov-agency.site";

const WORDMARK_SRC = "/kov/brand/kov-wordmark-bone.png";
const MONOGRAM_SRC = "/kov/brand/kov-monogram-k-transparent.png";

export type BadgeFace = "front" | "back";

// ── Outline ──────────────────────────────────────────────────────────────

/** Anything that can receive a path. Canvas 2D contexts and THREE.Shape /
 *  THREE.Path all expose these three, which is the whole reason the outline
 *  is traced with nothing fancier than a quadratic curve. */
export interface PathSink {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
}

/** Traces the badge outline into `sink`, in a y-down box of `w` x `h`
 *  starting at the origin — canvas coordinates. The 3D side feeds this an
 *  adapter that flips y and centres the result.
 *
 *  Three rounded corners and one cut: the chamfer is the whole point, so it
 *  is deliberately large enough to read at a glance and only ever appears
 *  once. */
export function traceBadgeOutline(sink: PathSink, w: number, h: number, r: number, cut: number) {
  sink.moveTo(r, 0);
  sink.lineTo(w - r, 0);
  sink.quadraticCurveTo(w, 0, w, r); // top-right
  sink.lineTo(w, h - cut);
  sink.lineTo(w - cut, h); // the cut corner
  sink.lineTo(r, h);
  sink.quadraticCurveTo(0, h, 0, h - r); // bottom-left
  sink.lineTo(0, r);
  sink.quadraticCurveTo(0, 0, r, 0); // top-left
}

// ── Assets ───────────────────────────────────────────────────────────────

const imageCache = new Map<string, HTMLImageElement | null>();

function loadImage(src: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(src);
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    // A missing wordmark must not take the page down with it: the painter
    // falls back to drawing the letters as type.
    img.onerror = () => {
      imageCache.set(src, null);
      resolve(null);
    };
    img.src = src;
  });
}

/** Resolves once the brand images and the web fonts are available, so the
 *  badge can be repainted with the real thing rather than with a fallback
 *  stack. */
export async function badgeAssetsReady(): Promise<void> {
  await Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    loadImage(WORDMARK_SRC),
    loadImage(MONOGRAM_SRC),
  ]);
}

export function familyOf(cssVar: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return value ? `${value}, ${fallback}` : fallback;
}

// ── Text helpers ─────────────────────────────────────────────────────────

/** Draws letter-spaced text centred on `cx`.
 *
 *  ctx.letterSpacing exists but only in recent engines, and every label on
 *  this badge is tracked — a silent no-op would collapse the whole type
 *  system of the card on older Safari. Drawing glyph by glyph always works. */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number
) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let x = cx - total / 2;
  for (let i = 0; i < chars.length; i += 1) {
    ctx.fillText(chars[i], x, y);
    x += widths[i] + spacing;
  }
}

function drawImageCentred(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  targetW: number
) {
  const scale = targetW / img.width;
  ctx.drawImage(img, cx - targetW / 2, cy - (img.height * scale) / 2, targetW, img.height * scale);
}

// ── The painter ──────────────────────────────────────────────────────────

/** Paints one face of the badge into `canvas`, sized TEX_W x TEX_H.
 *
 *  Safe to call more than once: it clears first, and it is meant to be
 *  called a second time once badgeAssetsReady() resolves. */
export function paintBadgeFace(canvas: HTMLCanvasElement, face: BadgeFace) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const display = familyOf("--font-display", "system-ui, sans-serif");
  const mono = familyOf("--font-mono", "ui-monospace, monospace");

  ctx.clearRect(0, 0, TEX_W, TEX_H);
  ctx.save();

  // Clip to the silhouette, then fill: the card is black to its own edge and
  // nothing bleeds past the chamfer.
  ctx.beginPath();
  traceBadgeOutline(ctx, TEX_W, TEX_H, CARD_RADIUS * PX_PER_UNIT, CARD_CUT * PX_PER_UNIT);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // A very slight top-down lift, so the card is not a flat black rectangle
  // under the studio lighting.
  const wash = ctx.createLinearGradient(0, 0, 0, TEX_H);
  wash.addColorStop(0, "rgba(255,255,255,0.05)");
  wash.addColorStop(0.55, "rgba(255,255,255,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // The outline, inset, following the same path — chamfer included.
  ctx.save();
  ctx.translate(16, 16);
  ctx.beginPath();
  traceBadgeOutline(
    ctx,
    TEX_W - 32,
    TEX_H - 32,
    CARD_RADIUS * PX_PER_UNIT - 10,
    CARD_CUT * PX_PER_UNIT - 22
  );
  ctx.closePath();
  ctx.strokeStyle = "rgba(231,231,229,0.20)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  if (face === "front") {
    paintFront(ctx, display, mono);
  } else {
    paintBack(ctx, display, mono);
  }

  ctx.restore();
}

function paintFront(ctx: CanvasRenderingContext2D, display: string, mono: string) {
  const cx = TEX_W / 2;

  // Signal dot.
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(cx, 112, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(231,231,229,0.55)";
  ctx.font = `600 19px ${mono}`;
  drawTracked(ctx, "ACCÈS DÉBLOQUÉ", cx, 168, 7);

  // The wordmark — the whole point of the card. Drawn as type only if the
  // asset somehow did not load.
  const wordmark = imageCache.get(WORDMARK_SRC);
  if (wordmark) {
    drawImageCentred(ctx, wordmark, cx, 300, 330);
  } else {
    ctx.fillStyle = BONE;
    ctx.font = `700 96px ${display}`;
    drawTracked(ctx, "KOV", cx, 332, 10);
  }

  ctx.strokeStyle = "rgba(231,231,229,0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 110, 400);
  ctx.lineTo(cx + 110, 400);
  ctx.stroke();

  ctx.fillStyle = BONE;
  ctx.font = `700 118px ${display}`;
  drawTracked(ctx, "−10 %", cx, 540, 2);

  ctx.fillStyle = "rgba(231,231,229,0.55)";
  ctx.font = `600 18px ${mono}`;
  drawTracked(ctx, "SUR VOTRE SITE", cx, 606, 5);
  drawTracked(ctx, "OU VOTRE AUDIT", cx, 640, 5);

  // Sits well clear of the chamfer: at this height the cut edge has not
  // started eating into the card yet.
  ctx.fillStyle = "rgba(231,231,229,0.7)";
  ctx.font = `500 22px ${mono}`;
  drawTracked(ctx, BADGE_URL, cx, 790, 2);
}

function paintBack(ctx: CanvasRenderingContext2D, display: string, mono: string) {
  const cx = TEX_W / 2;

  const monogram = imageCache.get(MONOGRAM_SRC);
  if (monogram) {
    ctx.globalAlpha = 0.9;
    drawImageCentred(ctx, monogram, cx, 330, 260);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = BONE;
    ctx.font = `700 200px ${display}`;
    drawTracked(ctx, "K", cx, 400, 0);
  }

  ctx.fillStyle = "rgba(231,231,229,0.45)";
  ctx.font = `600 18px ${mono}`;
  drawTracked(ctx, "CODE", cx, 560, 7);

  // The code is on the card as a flourish. The copy-able one lives in the
  // page's HTML, where it can be selected, read aloud and copied — a texture
  // on a 3D mesh is none of those things.
  ctx.fillStyle = BONE;
  ctx.font = `600 34px ${mono}`;
  drawTracked(ctx, BADGE_CODE, cx, 612, 2);

  ctx.strokeStyle = "rgba(227,30,36,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 92, 646);
  ctx.lineTo(cx + 92, 646);
  ctx.stroke();

  ctx.fillStyle = "rgba(231,231,229,0.7)";
  ctx.font = `500 22px ${mono}`;
  drawTracked(ctx, BADGE_URL, cx, 790, 2);
}

// ── The band ─────────────────────────────────────────────────────────────

/** One repeating tile of the lanyard strap: the wordmark on black, in place
 *  of the reference component's own branding. */
export const BAND_W = 256;
export const BAND_H = 64;

export function paintLanyardBand(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, BAND_W, BAND_H);
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, BAND_W, BAND_H);

  // Edge piping — what makes a flat strip read as woven webbing.
  ctx.fillStyle = "rgba(231,231,229,0.18)";
  ctx.fillRect(0, 5, BAND_W, 1.5);
  ctx.fillRect(0, BAND_H - 6.5, BAND_W, 1.5);

  ctx.fillStyle = BONE;
  ctx.font = `700 26px ${familyOf("--font-display", "system-ui, sans-serif")}`;
  ctx.textBaseline = "middle";
  drawTracked(ctx, "KOV", BAND_W * 0.34, BAND_H / 2, 6);

  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(BAND_W * 0.74, BAND_H / 2, 4.5, 0, Math.PI * 2);
  ctx.fill();
}
