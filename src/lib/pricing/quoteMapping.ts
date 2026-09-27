import { allocate } from "./money.ts";
import { getRound } from "./rounds.ts";
import type { PricedLine, PricingResult } from "./engine.ts";
import type { DisplayMode, RoundCode } from "./types.ts";

// De la configuration aux lignes du devis.
//
// ── LE PROBLÈME ──────────────────────────────────────────────────────────
//
// Le prix HT est arrondi à 50 € au niveau du PROJET, après majorations. Les
// lignes, elles, sont calculées avant. Recalculer un prix par ligne donne
// donc une somme qui ne tombe pas sur le total.
//
// Et ce n'est pas un détail cosmétique : createQuote recalcule
// `subtotal = Σ quantité × prix unitaire` à partir des lignes qu'on lui
// passe. Des lignes qui ne somment pas juste produisent un devis dont le
// total diffère du prix affiché dans le configurateur, au centime près,
// sans que rien ne le signale.
//
// ── LA SOLUTION : ON ALLOUE, ON NE RECALCULE PAS ─────────────────────────
//
//   subtotal_cents = prix_avant_remise      (garanti par l'absorption)
//   discount_cents = prix_avant_remise − prix_HT
//   total_cents    = prix_HT                (exact, par construction)
//
// L'identité `subtotal − discount = total` tient au centime. Sans remise,
// `discount` vaut exactement zéro : pas de remise fantôme née d'un arrondi.

export interface QuoteLineDraft {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface QuoteDraft {
  lineItems: QuoteLineDraft[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  /** Proposées au client, jamais additionnées. */
  optionLines: QuoteLineDraft[];
  assumptions: string[];
}

interface Group {
  key: string;
  description: string;
  quantity: number;
  sellCents: number;
}

function groupByRound(lines: PricedLine[]): Group[] {
  const byRound = new Map<RoundCode, PricedLine[]>();
  for (const line of lines) {
    byRound.set(line.roundCode, [...(byRound.get(line.roundCode) ?? []), line]);
  }

  return Array.from(byRound.entries()).map(([roundCode, roundLines]) => {
    const round = getRound(roundCode);
    return {
      key: roundCode,
      description: `${round.label} : ${roundLines.map((line) => line.label).join(", ")}`,
      quantity: 1,
      sellCents: roundLines.reduce((sum, line) => sum + line.sellCents, 0),
    };
  });
}

function groupByModule(lines: PricedLine[]): Group[] {
  return lines.map((line) => ({
    key: line.moduleKey,
    description: line.quantityUnit
      ? `${line.label} (${formatQuantity(line.quantity, line.quantityUnit)})`
      : line.label,
    quantity: line.quantity,
    sellCents: line.sellCents,
  }));
}

function formatQuantity(quantity: number, unit: string): string {
  const value = quantity.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  return `${value} ${unit}${quantity > 1 && !unit.includes(" ") ? "s" : ""}`;
}

/**
 * Répartit un total sur des groupes, en respectant les quantités.
 *
 * Une ligne de quantité 1 prend son montant tel quel, au centime. Une ligne
 * de quantité 3 a besoin d'un prix unitaire ENTIER en centimes, et
 * `montant / 3` ne tombe pas toujours juste : l'écart de quelques centimes
 * est reporté sur une ligne absorbante.
 *
 * L'absorbante est la plus grosse ligne de quantité 1, ce qui rend l'écart
 * proportionnellement invisible. S'il n'existe aucune ligne de quantité 1
 * (cas rare : un devis fait uniquement de modules quantifiés), la plus
 * grosse ligne passe à quantité 1 et sa quantité rejoint son libellé.
 */
function allocateToGroups(totalCents: number, groups: Group[]): QuoteLineDraft[] {
  if (groups.length === 0) return [];

  const amounts = allocate(totalCents, groups.map((group) => group.sellCents));
  const drafts: QuoteLineDraft[] = groups.map((group, index) => ({
    description: group.description,
    quantity: group.quantity,
    unitPriceCents: amounts[index],
  }));

  let absorberIndex = -1;
  let absorberSell = -1;
  for (let i = 0; i < groups.length; i += 1) {
    if (groups[i].quantity === 1 && groups[i].sellCents > absorberSell) {
      absorberIndex = i;
      absorberSell = groups[i].sellCents;
    }
  }

  if (absorberIndex === -1) {
    // Aucune ligne de quantité 1 : la plus grosse le devient, et sa
    // quantité passe dans le libellé plutôt que de disparaître.
    let largest = 0;
    for (let i = 1; i < groups.length; i += 1) {
      if (groups[i].sellCents > groups[largest].sellCents) largest = i;
    }
    drafts[largest].quantity = 1;
    absorberIndex = largest;
  }

  let drift = 0;
  for (let i = 0; i < drafts.length; i += 1) {
    if (drafts[i].quantity === 1) {
      drafts[i].unitPriceCents = amounts[i];
      continue;
    }
    const unit = Math.round(amounts[i] / drafts[i].quantity);
    drift += amounts[i] - unit * drafts[i].quantity;
    drafts[i].unitPriceCents = unit;
  }
  drafts[absorberIndex].unitPriceCents += drift;

  return drafts;
}

export function buildQuoteDraft(
  result: PricingResult,
  displayMode: DisplayMode,
  templateAssumptions: string[]
): QuoteDraft {
  const groups = displayMode === "round" ? groupByRound(result.lines) : groupByModule(result.lines);
  const lineItems = allocateToGroups(result.preDiscountCents, groups);

  // Les options sont chiffrées à leur prix brut, sans majoration ni arrondi
  // projet : elles ne font pas partie du total, donc rien ne doit les y
  // rattacher. Le devis les présente comme des propositions, pas comme des
  // lignes qu'on aurait oublié d'additionner.
  const optionGroups = displayMode === "round" ? groupByRound(result.optionLines) : groupByModule(result.optionLines);
  const optionLines: QuoteLineDraft[] = optionGroups.map((group) => ({
    description: group.description,
    quantity: group.quantity,
    unitPriceCents: group.quantity > 0 ? Math.round(group.sellCents / group.quantity) : group.sellCents,
  }));

  // Les hypothèses des modules retenus viennent en premier : elles sont
  // spécifiques à ce projet, là où les gabarits valent pour tous.
  const moduleAssumptions = result.lines
    .map((line) => line.quoteAssumption)
    .filter((assumption): assumption is string => Boolean(assumption));

  return {
    lineItems,
    subtotalCents: result.preDiscountCents,
    discountCents: result.discountCents,
    totalCents: result.priceExclVatCents,
    optionLines,
    assumptions: [...moduleAssumptions, ...templateAssumptions],
  };
}

/** La somme réelle des lignes, pour vérifier qu'elle tombe sur le sous-total. */
export function sumLineItems(lineItems: QuoteLineDraft[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
}
