// Fixed size per widget — "pas de resize libre en V1" (spec §10): the
// system assigns one of these, the user can only reorder, never resize.
// Tailwind spans below are chosen so the 7 sizes tile a 4-column grid into
// exactly 3 rows with zero gaps in the *default* order (2x2 + 1x2 + four
// 1x1 + 2x1 = 12 cells = 4 cols × 3 rows exactly). Reordering afterwards
// relies on `grid-flow-row-dense` to keep repacking as cleanly as CSS's
// own dense algorithm can manage — not a guaranteed-perfect bin packer,
// but the standard practical tool for a reorderable bento-style grid.
export type HeroWidgetId =
  | "spotlight"
  | "responsive"
  | "performance"
  | "studio"
  | "expertise"
  | "journal"
  | "start-project";

export const HERO_WIDGET_SIZE: Record<HeroWidgetId, string> = {
  spotlight: "col-span-2 row-span-2",
  responsive: "col-span-1 row-span-2",
  performance: "col-span-1 row-span-1",
  studio: "col-span-1 row-span-1",
  expertise: "col-span-1 row-span-1",
  journal: "col-span-1 row-span-1",
  "start-project": "col-span-2 row-span-1",
};

// Default order (spec §11) — also what "Réinitialiser" restores.
export const DEFAULT_HERO_WIDGET_ORDER: HeroWidgetId[] = [
  "spotlight",
  "responsive",
  "performance",
  "studio",
  "expertise",
  "journal",
  "start-project",
];

// Fixed editorial order for mobile (spec §23) — drag is disabled there
// entirely, so this never changes at runtime.
//
// Two of the seven, not all seven. Stacked one per row on a phone the full
// set came to roughly 1660px of widgets: the "responsive" preview alone is
// a 3/4 box, which is taller than a phone's own screen is wide by half
// again. Counting the copy above it, arriving on the homepage meant
// scrolling past about three screens of hero before the site started.
//
// A bento grid is a desktop idea. It reads as a dashboard because seven
// tiles are visible at once and the eye chooses; stacked vertically it is
// just a queue, and five of those tiles duplicate a section further down
// the page that says the same thing with more room. So mobile keeps the
// two that are not repeated anywhere above the fold: one real project, and
// the newest article. The others are not lost, they are where they belong.
export const MOBILE_HERO_WIDGET_ORDER: HeroWidgetId[] = ["spotlight", "journal"];

// v2: bumped when the widget upgrade (design pass) shipped, in case a
// stored v1 order ever became incompatible with a future widget set —
// migrated forward once (see readStoredOrder in HeroWidgetGrid.tsx), not
// read directly, so an incompatible v1 value can never leak through.
export const HERO_WIDGET_LAYOUT_STORAGE_KEY_V1 = "kov-home-widget-layout";
export const HERO_WIDGET_LAYOUT_STORAGE_KEY = "kov-home-widget-layout-v2";
export const HERO_WIDGET_HINT_SEEN_STORAGE_KEY = "kov-home-widget-hint-seen";
export const HERO_WIDGET_ANIMATIONS_STORAGE_KEY = "kov-home-widget-animations";
