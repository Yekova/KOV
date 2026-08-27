// Shared by /studio (full page) and the nav's Studio dropdown, so the two
// never drift — one is the canonical list, the other a preview of it.
export const PRINCIPLES = [
  { slug: "brutal", word: "Brutal", body: "Dire ce dont le projet a besoin — pas ce qui est simplement confortable à entendre." },
  { slug: "precis", word: "Précis", body: "Chaque décision compte : un pixel, un mot, une interaction ou une ligne de code doit avoir une raison d'être." },
  { slug: "immersif", word: "Immersif", body: "On ne conçoit pas des pages. On conçoit des expériences dont on se souvient." },
  { slug: "intentionnel", word: "Intentionnel", body: "Une tendance n'est jamais une raison suffisante. Chaque élément doit mériter sa place." },
] as const;
