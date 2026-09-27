import type { PricingSettings } from "./types.ts";

// Le coût de revient journalier : calculé, jamais saisi.
//
// C'est le chiffre qui rend tout le reste vérifiable. Un prix se défend
// devant un client avec des jours et des taux ; il se défend devant soi-même
// avec celui-ci. Et c'est le seul nombre du module dont une erreur ne se
// verrait pas : un taux de vente faux saute aux yeux sur le devis, un coût
// de revient faux ne se remarque qu'à la fin de l'année.
//
// Les deux formules ne sont pas deux variantes d'écriture. Elles disent deux
// choses différentes sur l'endroit où les cotisations sont prélevées :
//
//   Société à l'IS (gérant TNS) — les cotisations s'assoient sur la
//   RÉMUNÉRATION. On les ajoute donc au numérateur, avec le reste des
//   charges, et on divise par les jours facturables.
//
//   Micro-entreprise — les cotisations s'assoient sur le CHIFFRE D'AFFAIRES.
//   Facturer un jour de plus coûte donc un peu plus cher en cotisations :
//   elles ne peuvent pas être ajoutées au numérateur, elles rétrécissent le
//   dénominateur. C'est le piège de ce calcul, et c'est pour ça que les deux
//   régimes ne peuvent pas partager une seule formule.

export interface CostOfSale {
  /** Coût de revient d'un jour, en centimes. */
  dayRateCents: number;
  /** Le total annuel à couvrir : rémunération (chargée si IS), charges fixes, amortissements. */
  annualBurdenCents: number;
  billableDays: number;
  /** Faux tant qu'aucun expert-comptable n'a validé le taux de cotisations. */
  confirmed: boolean;
}

export function computeCostOfSale(settings: PricingSettings): CostOfSale {
  const { targetNetIncomeCents, contributionRateBp, fixedCostsCents, depreciationCents, billableDays } = settings;

  if (billableDays <= 0) {
    throw new Error("Le nombre de jours facturables doit être strictement positif.");
  }

  let annualBurdenCents: number;
  let dayRateCents: number;

  if (settings.regime === "is") {
    annualBurdenCents =
      (targetNetIncomeCents * (10_000 + contributionRateBp)) / 10_000 + fixedCostsCents + depreciationCents;
    dayRateCents = annualBurdenCents / billableDays;
  } else {
    annualBurdenCents = targetNetIncomeCents + fixedCostsCents + depreciationCents;
    const netShare = (10_000 - contributionRateBp) / 10_000;
    if (netShare <= 0) {
      throw new Error("Un taux de cotisations de 100 % ou plus ne laisse aucun revenu : le coût de revient est infini.");
    }
    dayRateCents = annualBurdenCents / (billableDays * netShare);
  }

  return {
    dayRateCents: Math.round(dayRateCents),
    annualBurdenCents: Math.round(annualBurdenCents),
    billableDays,
    confirmed: settings.contributionRateConfirmed,
  };
}

/**
 * Le coût d'un jour pour un rôle donné, selon qu'il est produit en interne
 * ou confié à un freelance.
 *
 * Un rôle sous-traité sans coût freelance connu retombe sur le coût de
 * revient interne : c'est faux, mais c'est faux dans le sens prudent, et
 * l'alerte de marge par rôle le signalera. Inventer un coût freelance
 * serait pire, parce que le chiffre aurait l'air fiable.
 */
export function roleCostCents(
  subcontracted: boolean,
  freelanceCostCents: number | null,
  internalDayRateCents: number
): number {
  if (subcontracted && freelanceCostCents !== null) return freelanceCostCents;
  return internalDayRateCents;
}
