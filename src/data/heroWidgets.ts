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

// There is no mobile order any more, and no mobile widgets: the grid is a
// desktop composition, and HeroScene keeps it out of the flow below md.
//
// Spec §23 gave mobile a fixed editorial order of all seven, stacked one
// per row. That came to roughly 1660px of widgets on a 375px screen, so
// arriving on the homepage meant scrolling past about three screens of
// hero before the site started. Cutting the list to two helped and still
// missed the point: a bento grid reads as a dashboard because several
// tiles are visible at once and the eye chooses. In a single column it is
// a queue, and every tile in it restates a section further down the page
// that says the same thing with more room.
//
// So a phone gets the hero's actual job instead: one promise, one action.

// v2: bumped when the widget upgrade (design pass) shipped, in case a
// stored v1 order ever became incompatible with a future widget set —
// migrated forward once (see readStoredOrder in HeroWidgetGrid.tsx), not
// read directly, so an incompatible v1 value can never leak through.
export const HERO_WIDGET_LAYOUT_STORAGE_KEY_V1 = "kov-home-widget-layout";
export const HERO_WIDGET_LAYOUT_STORAGE_KEY = "kov-home-widget-layout-v2";
export const HERO_WIDGET_HINT_SEEN_STORAGE_KEY = "kov-home-widget-hint-seen";
export const HERO_WIDGET_ANIMATIONS_STORAGE_KEY = "kov-home-widget-animations";
