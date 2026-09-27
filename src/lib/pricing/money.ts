// L'arithmétique du prix.
//
// Tout est en centimes entiers et en points de base (1 % = 100 bp). La
// règle n'est pas un tic de style : un prix qui doit être justifié ligne
// par ligne ne peut pas dépendre de la façon dont une machine arrondit
// 0,1 + 0,2. Les jours restent des décimaux — ce sont des durées, pas de
// l'argent, et 1,6 jour n'a pas besoin d'être exact au centième près.

/** cents × bp / 10 000, arrondi au centime. */
export function applyBp(cents: number, bp: number): number {
  return Math.round((cents * bp) / 10_000);
}

/** cents × (1 + bp / 10 000), arrondi au centime. */
export function upliftBp(cents: number, bp: number): number {
  return Math.round((cents * (10_000 + bp)) / 10_000);
}

/** Indexe une valeur de base 2027 sur la version tarifaire. */
export function indexCents(baseCents: number, indexationBp: number): number {
  return upliftBp(baseCents, indexationBp);
}

/**
 * Arrondi au pas commercial (50 € par défaut, donc 5 000 centimes).
 *
 * Math.round tranche les demis vers le haut, ce qui est l'arrondi
 * commercial attendu : 2 825 € donne 2 850 €, pas 2 800 €.
 */
export function roundToStep(cents: number, stepCents: number): number {
  if (stepCents <= 0) return Math.round(cents);
  return Math.round(cents / stepCents) * stepCents;
}

/** Part d'un montant sur un autre, en points de base. Null si le dénominateur est nul. */
export function shareBp(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return Math.round((part / whole) * 10_000);
}

/**
 * Répartit `totalCents` sur des poids, au centime près et sans perte.
 *
 * Méthode du plus fort reste : chaque part reçoit son plancher, puis les
 * centimes restants vont aux parts dont la fraction abandonnée était la
 * plus grande. La somme du résultat est EXACTEMENT `totalCents`, ce qui
 * est tout l'intérêt — recalculer chaque ligne indépendamment donnerait
 * une somme qui ne tombe pas sur le total affiché au client.
 *
 * Des poids tous nuls répartissent à parts égales : c'est le seul cas où
 * il n'y a pas de proportion à respecter, et rendre zéro perdrait de
 * l'argent en route.
 */
export function allocate(totalCents: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];

  const sum = weights.reduce((a, b) => a + b, 0);
  const effective = sum === 0 ? weights.map(() => 1) : weights;
  const effectiveSum = sum === 0 ? n : sum;

  const exact = effective.map((w) => (totalCents * w) / effectiveSum);
  const floors = exact.map((value) => Math.floor(value));
  let remainder = totalCents - floors.reduce((a, b) => a + b, 0);

  // Par reste décroissant, puis par index : sans le second critère, deux
  // restes égaux se départageraient selon l'implémentation du tri, et le
  // même devis ne donnerait pas toujours les mêmes centimes.
  const order = exact
    .map((value, index) => ({ index, fraction: value - floors[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  const result = [...floors];
  for (let i = 0; remainder > 0; i = (i + 1) % n) {
    result[order[i].index] += 1;
    remainder -= 1;
  }
  return result;
}

const EURO_FORMAT = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const EURO_FORMAT_PRECISE = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 285 000 → « 2 850 € ». Les centimes sont masqués : un prix arrondi à 50 € n'en a jamais. */
export function formatEuros(cents: number): string {
  return EURO_FORMAT.format(cents / 100);
}

/** 285 042 → « 2 850,42 € ». Pour les lignes, où les centimes existent. */
export function formatEurosPrecise(cents: number): string {
  return EURO_FORMAT_PRECISE.format(cents / 100);
}

/** 1,6 → « 1,6 j ». Un jour entier ne traîne pas de décimale. */
export function formatDays(days: number): string {
  const rounded = Math.round(days * 100) / 100;
  return `${rounded.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} j`;
}

/** 1 780 → « 17,8 % ». */
export function formatBp(bp: number): string {
  return `${(bp / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}
