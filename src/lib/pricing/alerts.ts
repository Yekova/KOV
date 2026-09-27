import { formatBp, formatEuros } from "./money.ts";
import type { PricingResult } from "./engine.ts";
import type { PricingCatalog, PricingConditions, PricingSelection } from "./types.ts";

// Les alertes.
//
// C'est la partie de l'outil qui a un intérêt. Calculer un prix, n'importe
// quel tableur le fait ; dire « ce prix détruit de la marge et voici
// pourquoi » est ce qui évite de signer un projet à perte.
//
// Trois niveaux, et la différence entre eux est une différence de
// conséquence, pas de ton :
//
//   bloquant      la génération du devis est refusée. Une dérogation
//                 motivée et journalisée est le seul contournement.
//   avertissement affiché, n'empêche rien. On peut avoir de bonnes raisons.
//   information   un repère de marché, pas un jugement.
//
// Chaque alerte porte un `fix` : dire ce qui ne va pas sans dire quoi en
// faire laisse la personne exactement là où elle était.

export type AlertLevel = "blocking" | "warning" | "info";

export interface PricingAlert {
  code: string;
  level: AlertLevel;
  title: string;
  detail: string;
  fix: string | null;
}

export interface AlertContext {
  /** Date de consultation la plus ancienne parmi les références utilisées. */
  oldestBenchmarkConsultedAt: string | null;
  /** Aujourd'hui, injecté pour que le test de fraîcheur soit reproductible. */
  today: Date;
}

export function collectAlerts(
  result: PricingResult,
  catalog: PricingCatalog,
  selection: PricingSelection,
  conditions: PricingConditions,
  context: AlertContext
): PricingAlert[] {
  const { settings } = catalog;
  const alerts: PricingAlert[] = [];

  // ── Marge ──────────────────────────────────────────────────────────────

  if (result.marginCents < 0) {
    alerts.push({
      code: "margin-negative",
      level: "blocking",
      title: "Ce projet perd de l'argent",
      detail: `Marge de ${formatEuros(result.marginCents)} : le prix ne couvre pas le coût de production de ${formatEuros(result.productionCostCents)}.`,
      fix: "Retirer des modules, relever les taux de vente, ou renoncer au projet.",
    });
  } else if (result.marginBp !== null && result.marginBp < settings.targetMarginBp) {
    alerts.push({
      code: "margin-below-target",
      level: "warning",
      title: "Marge sous la cible",
      detail: `${formatBp(result.marginBp)} de marge pour une cible de ${formatBp(settings.targetMarginBp)}, soit ${formatEuros(result.marginCents)}.`,
      fix: "Un projet de référence ou une relation longue peuvent le justifier. Sinon, revoir la composition.",
    });
  }

  // ── TJM implicite ──────────────────────────────────────────────────────

  if (result.impliedDayRateCents !== null) {
    if (result.impliedDayRateCents < result.costOfSale.dayRateCents) {
      alerts.push({
        code: "day-rate-below-cost",
        level: "blocking",
        title: "Le TJM implicite est sous le coût de revient",
        detail: `${formatEuros(result.impliedDayRateCents)} par jour vendu pour un coût de revient de ${formatEuros(result.costOfSale.dayRateCents)}. Chaque jour travaillé coûte plus qu'il ne rapporte.`,
        fix: "Réduire les jours ou remonter le prix. Aucun volume ne rattrape un TJM sous le coût.",
      });
    } else if (result.impliedDayRateCents < settings.floorDayRateCents) {
      alerts.push({
        code: "day-rate-below-floor",
        level: "warning",
        title: "TJM implicite sous le plancher",
        detail: `${formatEuros(result.impliedDayRateCents)} par jour pour un plancher fixé à ${formatEuros(settings.floorDayRateCents)}.`,
        fix: "Vérifier que les jours annoncés correspondent bien au travail prévu.",
      });
    }
  }

  // ── Sous-traitance ─────────────────────────────────────────────────────
  //
  // Une seule alerte par rôle, même s'il est sous-traité sur cinq modules :
  // cinq fois le même message n'apprend rien la cinquième fois.

  const flaggedRoles = new Set<string>();
  for (const line of result.lines) {
    for (const role of line.roles) {
      if (!role.subcontracted || flaggedRoles.has(role.roleCode)) continue;
      const catalogRole = catalog.roles.find((r) => r.code === role.roleCode);
      const freelanceCost = catalogRole?.freelanceCostCents;
      if (freelanceCost != null && role.sellRateCents < freelanceCost) {
        flaggedRoles.add(role.roleCode);
        alerts.push({
          code: `subcontracting-loss-${role.roleCode}`,
          level: "warning",
          title: `Sous-traiter « ${role.roleLabel} » détruit de la marge`,
          detail: `Vendu ${formatEuros(role.sellRateCents)} par jour, acheté ${formatEuros(freelanceCost)}. Chaque jour confié coûte ${formatEuros(freelanceCost - role.sellRateCents)} de plus qu'il ne rapporte.`,
          fix: "Produire ce rôle en interne, ou relever son taux de vente.",
        });
      }
    }
  }

  if (result.subcontractedShareBp !== null && result.subcontractedShareBp > settings.maxSubcontractedShareBp) {
    alerts.push({
      code: "subcontracting-share",
      level: "warning",
      title: "Part sous-traitée élevée",
      detail: `${formatBp(result.subcontractedShareBp)} des jours sont confiés à des freelances, pour un seuil de ${formatBp(settings.maxSubcontractedShareBp)}.`,
      fix: "Vérifier la marge réelle et la charge de coordination, qui n'est pas chiffrée dans ces jours.",
    });
  }

  // ── Position de marché ─────────────────────────────────────────────────

  if (result.band?.belowLowest) {
    alerts.push({
      code: "band-below",
      level: "info",
      title: "Prix sous la bande freelance",
      detail: `${formatEuros(result.priceExclVatCents)} se situe sous la fourchette basse observée pour cette offre.`,
      fix: "Risque de sous-évaluation : un prix trop bas se lit comme un signal sur la prestation.",
    });
  }
  if (result.band?.aboveHighest) {
    alerts.push({
      code: "band-above",
      level: "info",
      title: "Prix au-dessus de la bande premium",
      detail: `${formatEuros(result.priceExclVatCents)} dépasse la fourchette haute observée pour cette offre.`,
      fix: "À justifier par le portfolio et par ce que le projet contient de singulier.",
    });
  }

  // ── Cadrage ────────────────────────────────────────────────────────────

  const hasScoping = result.lines.some((line) => line.roundCode === "R0");
  if (result.totalDays > settings.scopingThresholdDays && !hasScoping) {
    alerts.push({
      code: "missing-scoping",
      level: "warning",
      title: "Projet long sans cadrage",
      detail: `${result.totalDays.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} jours de production sans aucun module de cadrage (R0).`,
      fix: "Proposer le cadrage payant : c'est là que se décident les jours des rounds suivants.",
    });
  }

  // ── Remise ─────────────────────────────────────────────────────────────

  if (conditions.discountBp > settings.maxDiscountBp) {
    alerts.push({
      code: "discount-too-high",
      level: "blocking",
      title: "Remise au-delà du maximum",
      detail: `${formatBp(conditions.discountBp)} demandés pour un plafond de ${formatBp(settings.maxDiscountBp)}.`,
      fix: `Ramener la remise à ${formatBp(settings.maxDiscountBp)} au plus, ou retirer un module.`,
    });
  }
  // Une remise sans motif est une remise qu'on ne saura pas expliquer trois
  // mois plus tard, quand le client suivant demandera la même.
  if (conditions.discountBp > 0 && !conditions.discountReason?.trim()) {
    alerts.push({
      code: "discount-unmotivated",
      level: "blocking",
      title: "Remise sans motif",
      detail: `Une remise de ${formatBp(conditions.discountBp)} est appliquée sans motif renseigné.`,
      fix: "Écrire le motif : il sera relu au moment de décider de la suivante.",
    });
  }

  // ── Fraîcheur des références ───────────────────────────────────────────

  if (context.oldestBenchmarkConsultedAt) {
    const consulted = new Date(`${context.oldestBenchmarkConsultedAt}T00:00:00`);
    const ageDays = Math.floor((context.today.getTime() - consulted.getTime()) / 86_400_000);
    if (ageDays > settings.benchmarkStalenessDays) {
      alerts.push({
        code: "benchmarks-stale",
        level: "info",
        title: "Références de marché à rafraîchir",
        detail: `La plus ancienne a ${ageDays} jours, pour un seuil de ${settings.benchmarkStalenessDays}.`,
        fix: "Rouvrir les baromètres et ressaisir les valeurs : elles justifient les taux devant un client.",
      });
    }
  }

  // ── Calibrage de la grille ─────────────────────────────────────────────
  //
  // Comparaison contre le prix de référence INDEXÉ, sinon l'alerte se
  // déclencherait sur toutes les offres dès la première année d'indexation
  // sans qu'aucune composition n'ait changé.
  //
  // Elle ne se déclenche que sur la composition par défaut, pas dès qu'on
  // ajoute un module : ajouter un module DOIT faire monter le prix, et
  // signaler cette hausse comme un écart à la grille serait absurde.

  if (result.referenceDeviationBp !== null && isDefaultComposition(selection, catalog)) {
    const deviation = Math.abs(result.referenceDeviationBp);
    if (deviation > settings.gridDeviationBp) {
      alerts.push({
        code: "grid-deviation",
        level: "info",
        title: "La composition par défaut s'écarte de la grille",
        detail: `${formatEuros(result.priceExclVatCents)} calculés contre ${formatEuros(result.referencePriceCents ?? 0)} de référence, soit ${formatBp(result.referenceDeviationBp)}.`,
        fix: "Revoir le prix de référence ou les jours de la composition. Les taux, eux, ne se corrigent pas pour faire tomber juste.",
      });
    }
  }

  // ── Coût de revient non confirmé ───────────────────────────────────────
  //
  // Pas dans la liste de la spec, mais le coût de revient pilote deux
  // alertes bloquantes. Présenter un blocage calculé sur un taux que la
  // spec elle-même donne comme « à confirmer » sans le dire serait
  // présenter une estimation comme un fait.

  if (!result.costOfSale.confirmed) {
    alerts.push({
      code: "cost-of-sale-unconfirmed",
      level: "info",
      title: "Coût de revient calculé sur un taux non confirmé",
      detail: `Le taux de cotisations de ${formatBp(settings.contributionRateBp)} de la version « ${settings.label} » n'a pas été validé. Le coût de ${formatEuros(result.costOfSale.dayRateCents)} par jour en dépend directement, ainsi que les alertes de marge.`,
      fix: "Faire confirmer le taux par l'expert-comptable, puis cocher la case dans les réglages.",
    });
  }

  return alerts;
}

/** Y a-t-il au moins une alerte bloquante ? */
export function hasBlockingAlert(alerts: PricingAlert[]): boolean {
  return alerts.some((alert) => alert.level === "blocking");
}

/**
 * La sélection est-elle exactement la composition par défaut de l'offre ?
 *
 * Comparaison sur l'ensemble des clés et sur les quantités : ajouter un
 * module, en retirer un, ou changer une quantité suffit à sortir de la
 * grille, et donc à désactiver l'alerte de calibrage.
 */
function isDefaultComposition(selection: PricingSelection, catalog: PricingCatalog): boolean {
  const offer = catalog.offers.find((o) => o.key === selection.offerKey);
  if (!offer) return false;

  const defaults = (catalog.defaultModulesByOffer[offer.key] ?? [])
    .map((entry) => `${entry.moduleKey}:${entry.quantity}`)
    .sort();

  const chosen = selection.modules
    .map((module) => `${module.moduleKey}:${module.quantity}`)
    .sort();

  return defaults.length > 0 && defaults.length === chosen.length && defaults.every((key, i) => key === chosen[i]);
}
