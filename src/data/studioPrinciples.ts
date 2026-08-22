// Shared by /studio (full page) and the nav's Studio dropdown, so the two
// never drift — one is the canonical list, the other a preview of it.
export const PRINCIPLES = [
  { slug: "brutal", word: "Brutal", body: "On dit ce dont un projet a besoin, pas ce qui est confortable à entendre." },
  { slug: "precis", word: "Précis", body: "Chaque décision — un pixel, une ligne de texte, une ligne de code — a une raison d'être." },
  { slug: "immersif", word: "Immersif", body: "On conçoit des expériences, pas des pages. La différence, c'est ce dont on se souvient." },
  { slug: "intentionnel", word: "Intentionnel", body: "Rien n'est livré parce que c'est tendance. Ça l'est parce que ça mérite sa place." },
] as const;
