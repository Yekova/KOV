import { applyBp } from "./money.ts";
import type { ClientVatRegime, PricingSettings } from "./types.ts";

// La TVA, et la franchise en base.
//
// KOV est aujourd'hui en franchise : le devis porte la mention de l'article
// 293 B du CGI et aucun taux. Ce n'est pas un état permanent — le seuil de
// 37 500 € en prestations de services se franchit en un bon trimestre, et
// le jour où il l'est, tous les devis changent. Le moteur sait donc déjà
// calculer une TVA ; c'est le paramètre daté de la version tarifaire qui
// décide laquelle des deux situations s'applique, pas le code.

export interface VatResult {
  rateBp: number;
  amountCents: number;
  totalInclVatCents: number;
  /** La mention à imprimer. Null quand un taux réel s'applique. */
  exemptionMention: string | null;
  /** Le TTC doit-il être mis en avant plutôt que le HT ? */
  emphasiseInclVat: boolean;
}

export function computeVat(
  priceExclVatCents: number,
  settings: PricingSettings,
  clientVatRegime: ClientVatRegime
): VatResult {
  // Un client qui ne récupère pas la TVA raisonne en TTC : c'est ce qu'il
  // paie réellement. Lui présenter le HT en grand serait lui montrer un
  // prix qu'il ne verra jamais sur son relevé.
  const emphasiseInclVat = clientVatRegime !== "liable";

  if (settings.vatRegime === "franchise") {
    return {
      rateBp: 0,
      amountCents: 0,
      totalInclVatCents: priceExclVatCents,
      exemptionMention: settings.vatExemptionMention,
      // En franchise il n'y a pas d'écart entre HT et TTC : rien à mettre
      // en avant, les deux nombres sont le même.
      emphasiseInclVat: false,
    };
  }

  const amountCents = applyBp(priceExclVatCents, settings.vatRateBp);
  return {
    rateBp: settings.vatRateBp,
    amountCents,
    totalInclVatCents: priceExclVatCents + amountCents,
    exemptionMention: null,
    emphasiseInclVat,
  };
}

export interface FranchiseWatch {
  /** Le chiffre d'affaires de l'année, tel qu'il a été fourni. */
  turnoverCents: number;
  crossedBase: boolean;
  crossedIncreased: boolean;
  remainingCents: number;
}

/**
 * Où en est-on du seuil de franchise.
 *
 * Volontairement une fonction séparée qui prend le chiffre d'affaires en
 * paramètre : le moteur ne va pas le chercher lui-même. Un module de
 * pricing qui irait lire la facturation pour décider d'un régime fiscal
 * mélangerait deux responsabilités, et se tromperait le jour où on
 * simulerait un devis pour une autre année que l'année en cours.
 */
export function watchFranchiseThreshold(turnoverCents: number, settings: PricingSettings): FranchiseWatch {
  return {
    turnoverCents,
    crossedBase: turnoverCents > settings.franchiseThresholdCents,
    crossedIncreased: turnoverCents > settings.franchiseIncreasedThresholdCents,
    remainingCents: Math.max(0, settings.franchiseThresholdCents - turnoverCents),
  };
}
