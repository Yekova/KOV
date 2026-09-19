import { PILLARS } from "@/data/expertisePillars";

export type VisualKey = "strategy" | "design" | "development" | "motion" | "systems" | "integration";

/** Where a card sits in the finished composition, as a percentage of the
 *  stage. Percentages rather than pixels so the whole assembly scales with
 *  its container and the sequence never has to re-measure anything. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ExpertiseStep {
  slug: string;
  /** "01" … "06" — the order the system assembles in. */
  number: string;
  title: string;
  /** One line. The card carries nothing else. */
  claim: string;
  visual: VisualKey;
  rect: Rect;
  /** `strip` is the wide short card, which lays its visual out beside the
   *  text rather than above it; everything else is a column. */
  shape: "column" | "strip";
}

// The finished composition. Six rects that tile a rectangle with 2% gutters
// and no two cards the same size: one tall, one small, two wide, two medium.
//
// It is deliberately not a 3x2 grid. A grid would say these are six
// interchangeable things, and the whole section argues the opposite — that
// they assemble into one structure. Different sizes are what make the final
// frame read as an architecture rather than a table.
//
// Verified to tile: right edges reach 100, bottom edges reach 100, and no
// two rects overlap.
type PillarSlug = (typeof PILLARS)[number]["slug"];

const LAYOUT: Record<PillarSlug, { rect: Rect; shape: ExpertiseStep["shape"]; visual: VisualKey }> = {
  strategie: { rect: { x: 0, y: 0, w: 31, h: 60 }, shape: "column", visual: "strategy" },
  design: { rect: { x: 33, y: 0, w: 43, h: 36 }, shape: "column", visual: "design" },
  developpement: { rect: { x: 78, y: 0, w: 22, h: 36 }, shape: "column", visual: "development" },
  motion: { rect: { x: 33, y: 38, w: 67, h: 22 }, shape: "strip", visual: "motion" },
  systemes: { rect: { x: 0, y: 62, w: 48, h: 38 }, shape: "column", visual: "systems" },
  integration: { rect: { x: 50, y: 62, w: 50, h: 38 }, shape: "column", visual: "integration" },
};

// One source, and it is the one the rest of the site already uses. PILLARS
// carries the number, the slug and the title; `tagline` is the single line
// each card shows. Nothing is duplicated here — only where each pillar lands.
export const EXPERTISE_STEPS: ExpertiseStep[] = PILLARS.map((pillar) => ({
  slug: pillar.slug,
  number: pillar.number,
  title: pillar.title,
  claim: pillar.tagline,
  ...LAYOUT[pillar.slug],
}));

/** Centre of a rect, in stage percentage — used to frame the first card
 *  before the others exist. */
export function rectCentre(rect: Rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}
