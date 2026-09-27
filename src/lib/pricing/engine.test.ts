import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { priceConfiguration } from "./engine.ts";
import { computeCostOfSale } from "./costOfSale.ts";
import { collectAlerts, hasBlockingAlert, type AlertContext } from "./alerts.ts";
import { buildQuoteDraft, sumLineItems } from "./quoteMapping.ts";
import { allocate, roundToStep } from "./money.ts";
import { buildSchedule } from "./schedule.ts";
import {
  buildCatalog,
  defaultSelectionFor,
  DEFAULT_CONDITIONS,
  OFFERS,
  SETTINGS_2027,
  SETTINGS_2028,
} from "./testCatalog.ts";
import type { PricingConditions, PricingSelection } from "./types.ts";

// Les dix tests de docs/specs/pricing.md §7, plus ce qu'il a fallu ajouter.
//
// Ils tournent avec `node --test`, sans aucune dépendance : Node 24 retire
// les types nativement. C'est pour ça que les imports de ce dossier portent
// leur extension `.ts` — voir l'en-tête de types.ts.

const CATALOG_2027 = buildCatalog(SETTINGS_2027);
const CATALOG_2028 = buildCatalog(SETTINGS_2028);

const QUIET_CONTEXT: AlertContext = {
  oldestBenchmarkConsultedAt: null,
  today: new Date("2027-01-15T12:00:00Z"),
};

function conditions(overrides: Partial<PricingConditions> = {}): PricingConditions {
  return { ...DEFAULT_CONDITIONS, ...overrides };
}

function alertsFor(
  catalog: typeof CATALOG_2027,
  selection: PricingSelection,
  cond: PricingConditions,
  context: AlertContext = QUIET_CONTEXT
) {
  const result = priceConfiguration(catalog, selection, cond);
  return { result, alerts: collectAlerts(result, catalog, selection, cond, context) };
}

const codes = (alerts: { code: string }[]) => alerts.map((alert) => alert.code);

// ── 1. Calibrage ─────────────────────────────────────────────────────────

describe("1. Calibrage de la grille", () => {
  const PRICED_OFFERS = OFFERS.filter((offer) => offer.referencePriceCents !== null);

  for (const offer of PRICED_OFFERS) {
    test(`${offer.key} tombe à moins de 10 % de son prix de référence`, () => {
      const result = priceConfiguration(CATALOG_2027, defaultSelectionFor(offer.key), conditions());
      assert.notEqual(result.referenceDeviationBp, null);

      const deviation = Math.abs(result.referenceDeviationBp!);
      assert.ok(
        deviation <= 1000,
        `${offer.key} : ${(result.priceExclVatCents / 100).toFixed(0)} € calculés contre ` +
          `${(offer.referencePriceCents! / 100).toFixed(0)} € de référence, écart de ` +
          `${(deviation / 100).toFixed(1)} %. Le test signale, il ne corrige pas les taux.`
      );
    });
  }

  // Le module 3D passe à +8,9 % pour 10 % autorisés. Cette marge de 1,1
  // point est le vrai résultat du calibrage, et elle mérite d'être nommée :
  // dix euros de plus sur le taux MOTION casseraient le test sans que
  // personne ne comprenne pourquoi.
  test("le module 3D est l'offre la plus tendue, et on sait de combien", () => {
    const result = priceConfiguration(CATALOG_2027, defaultSelectionFor("immersif"), conditions());
    const deviation = result.referenceDeviationBp!;
    assert.equal(deviation, 889, "8,89 % : si ce nombre bouge, la composition ou un taux a changé.");
  });

  test("« sur mesure » n'a pas de grille, donc pas d'écart à mesurer", () => {
    const selection = { ...defaultSelectionFor("landing"), offerKey: "sur-mesure" };
    const result = priceConfiguration(CATALOG_2027, selection, conditions());
    assert.equal(result.referencePriceCents, null);
    assert.equal(result.referenceDeviationBp, null);
  });
});

// ── 2. Petit projet ──────────────────────────────────────────────────────

describe("2. Majoration petit projet", () => {
  test("la landing page (5,5 jours) déclenche les 15 %", () => {
    const result = priceConfiguration(CATALOG_2027, defaultSelectionFor("landing"), conditions());
    assert.equal(result.totalDays, 5.5);
    assert.equal(result.smallProjectApplied, true);
    assert.equal(result.smallProjectBp, 1500);
    assert.equal(result.priceExclVatCents, 285_000);
  });

  test("le site vitrine (16 jours) ne la déclenche pas", () => {
    const result = priceConfiguration(CATALOG_2027, defaultSelectionFor("vitrine"), conditions());
    assert.equal(result.totalDays, 16);
    assert.equal(result.smallProjectApplied, false);
    assert.equal(result.totalUpliftBp, 0);
  });

  test("le module 3D est pile sur le seuil de 8 jours, du bon côté", () => {
    const result = priceConfiguration(CATALOG_2027, defaultSelectionFor("immersif"), conditions());
    assert.equal(result.totalDays, 10);
    assert.equal(result.smallProjectApplied, false);
  });
});

// ── 3. Le cas limite du business plan ────────────────────────────────────

describe("3. Cas limite du business plan", () => {
  test("8 000 € pour 25 jours et 800 € d'externes, en 2028, perd environ 3 500 €", () => {
    const cost = computeCostOfSale(SETTINGS_2028);
    const marginCents = 800_000 - 80_000 - Math.round(25 * cost.dayRateCents);
    assert.ok(marginCents < 0, "la marge doit être négative");
    assert.equal(marginCents, -347_300, "-3 473 €, ce que la spec annonce à 3 500 € près");
  });

  test("une marge négative bloque la génération du devis", () => {
    // Le site vitrine en 2028 avec la remise maximale : 6 750 € vendus pour
    // 7 131 € de coût de production. C'est un scénario réaliste, pas un cas
    // fabriqué — c'est exactement ce que produit un « geste commercial » sur
    // une offre dont la marge est déjà mince.
    const { result, alerts } = alertsFor(
      CATALOG_2028,
      defaultSelectionFor("vitrine"),
      conditions({ discountBp: 1000, discountReason: "Premier projet de référence" })
    );
    assert.ok(result.marginCents < 0, `marge attendue négative, obtenue ${result.marginCents}`);
    assert.ok(codes(alerts).includes("margin-negative"));
    assert.equal(hasBlockingAlert(alerts), true);
  });
});

// ── 4. Remise ────────────────────────────────────────────────────────────

describe("4. Remise", () => {
  test("12 % est refusé", () => {
    const { alerts } = alertsFor(
      CATALOG_2027,
      defaultSelectionFor("vitrine"),
      conditions({ discountBp: 1200, discountReason: "Négociation" })
    );
    assert.ok(codes(alerts).includes("discount-too-high"));
    assert.equal(hasBlockingAlert(alerts), true);
  });

  test("10 % avec motif est accepté", () => {
    const { alerts } = alertsFor(
      CATALOG_2027,
      defaultSelectionFor("vitrine"),
      conditions({ discountBp: 1000, discountReason: "Client historique, troisième projet" })
    );
    assert.equal(hasBlockingAlert(alerts), false, `bloquants inattendus : ${codes(alerts).join(", ")}`);
  });

  test("10 % sans motif est refusé", () => {
    const { alerts } = alertsFor(
      CATALOG_2027,
      defaultSelectionFor("vitrine"),
      conditions({ discountBp: 1000, discountReason: "   " })
    );
    assert.ok(codes(alerts).includes("discount-unmotivated"));
    assert.equal(hasBlockingAlert(alerts), true);
  });

  test("la remise sort du prix, pas des lignes", () => {
    const result = priceConfiguration(
      CATALOG_2027,
      defaultSelectionFor("vitrine"),
      conditions({ discountBp: 1000, discountReason: "Motif" })
    );
    assert.equal(result.preDiscountCents - result.discountCents, result.priceExclVatCents);
    assert.ok(result.discountCents > 0);
  });

  test("sans remise, la remise vaut exactement zéro", () => {
    const result = priceConfiguration(CATALOG_2027, defaultSelectionFor("vitrine"), conditions());
    assert.equal(result.discountCents, 0);
    assert.equal(result.preDiscountCents, result.priceExclVatCents);
  });
});

// ── 5. TVA ───────────────────────────────────────────────────────────────

describe("5. TVA", () => {
  test("en franchise, aucune TVA et la mention est présente", () => {
    const result = priceConfiguration(CATALOG_2027, defaultSelectionFor("vitrine"), conditions());
    assert.equal(result.vat.rateBp, 0);
    assert.equal(result.vat.amountCents, 0);
    assert.equal(result.vat.totalInclVatCents, result.priceExclVatCents);
    assert.equal(result.vat.exemptionMention, "TVA non applicable, art. 293 B du CGI");
  });

  test("assujetti, la TVA est à 20 % et la mention disparaît", () => {
    const catalog = buildCatalog({ ...SETTINGS_2027, vatRegime: "standard" });
    const result = priceConfiguration(catalog, defaultSelectionFor("vitrine"), conditions());
    assert.equal(result.vat.rateBp, 2000);
    assert.equal(result.vat.amountCents, Math.round(result.priceExclVatCents * 0.2));
    assert.equal(result.vat.totalInclVatCents, result.priceExclVatCents + result.vat.amountCents);
    assert.equal(result.vat.exemptionMention, null);
  });

  test("un client non assujetti fait mettre le TTC en avant", () => {
    const catalog = buildCatalog({ ...SETTINGS_2027, vatRegime: "standard" });
    const selection = { ...defaultSelectionFor("vitrine"), clientVatRegime: "exempt" as const };
    const result = priceConfiguration(catalog, selection, conditions());
    assert.equal(result.vat.emphasiseInclVat, true);
  });

  test("en franchise il n'y a rien à mettre en avant : HT et TTC sont le même nombre", () => {
    const selection = { ...defaultSelectionFor("vitrine"), clientVatRegime: "exempt" as const };
    const result = priceConfiguration(CATALOG_2027, selection, conditions());
    assert.equal(result.vat.emphasiseInclVat, false);
  });
});

// ── 6. Échéancier ────────────────────────────────────────────────────────

describe("6. Échéancier", () => {
  test("la somme des échéances vaut exactement le total TTC", () => {
    for (const offer of OFFERS.filter((o) => o.referencePriceCents !== null)) {
      const result = priceConfiguration(CATALOG_2027, defaultSelectionFor(offer.key), conditions());
      const sum = result.schedule.reduce((total, entry) => total + entry.amountCents, 0);
      assert.equal(sum, result.vat.totalInclVatCents, `${offer.key} : les échéances ne tombent pas sur le total`);
    }
  });

  test("le résidu va sur la dernière échéance, pas sur la première", () => {
    // 100,01 € sur trois tiers : 3 333 + 3 333 + 3 335.
    const schedule = buildSchedule(10_001, [
      { label: "a", percentBp: 3333, roundCode: null },
      { label: "b", percentBp: 3333, roundCode: null },
      { label: "c", percentBp: 3334, roundCode: null },
    ]);
    assert.equal(schedule[0].amountCents, 3333);
    assert.equal(schedule.reduce((sum, entry) => sum + entry.amountCents, 0), 10_001);
    assert.ok(schedule[2].amountCents > 3334, "c'est la dernière qui absorbe");
  });

  test("un échéancier vide donne une échéance unique de 100 %", () => {
    const schedule = buildSchedule(500_000, []);
    assert.equal(schedule.length, 1);
    assert.equal(schedule[0].amountCents, 500_000);
  });
});

// ── 7. Arrondi et centimes ───────────────────────────────────────────────

describe("7. Arrondi", () => {
  test("le prix HT est arrondi à 50 €", () => {
    for (const offer of OFFERS.filter((o) => o.referencePriceCents !== null)) {
      const result = priceConfiguration(CATALOG_2027, defaultSelectionFor(offer.key), conditions());
      assert.equal(result.priceExclVatCents % 5000, 0, `${offer.key} n'est pas un multiple de 50 €`);
    }
  });

  test("roundToStep tranche les demis vers le haut, comme un arrondi commercial", () => {
    assert.equal(roundToStep(282_500, 5000), 285_000);
    assert.equal(roundToStep(282_499, 5000), 280_000);
    assert.equal(roundToStep(0, 5000), 0);
  });

  test("l'allocation ne perd jamais un centime", () => {
    // Trois montants dont la répartition ne tombe pas juste, et un cas à
    // poids nuls : c'est là qu'une implémentation naïve laisse filer des
    // centimes sans que personne ne s'en aperçoive.
    assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33]);
    assert.equal(allocate(999_999, [7, 11, 13, 17]).reduce((a, b) => a + b, 0), 999_999);
    assert.deepEqual(allocate(10, [0, 0, 0, 0]), [3, 3, 2, 2]);
    assert.equal(allocate(1, [5, 5]).reduce((a, b) => a + b, 0), 1);
  });

  test("les centimes ne dérivent pas, même sur un gros devis", () => {
    const result = priceConfiguration(CATALOG_2027, defaultSelectionFor("outil"), conditions());
    assert.ok(Number.isInteger(result.priceExclVatCents));
    assert.ok(Number.isInteger(result.productionCostCents));
    assert.ok(Number.isInteger(result.marginCents));
  });
});

// ── 8. Sous-traitance ────────────────────────────────────────────────────

describe("8. Sous-traitance", () => {
  test("FRONT sous-traité à 430 € pour une vente à 420 € déclenche l'alerte", () => {
    const selection = defaultSelectionFor("vitrine");
    const build = selection.modules.find((m) => m.moduleKey === "vitrine-build")!;
    build.subcontractedRoles = ["FRONT"];

    const { result, alerts } = alertsFor(CATALOG_2027, selection, conditions());
    assert.ok(codes(alerts).includes("subcontracting-loss-FRONT"));

    const front = result.lines.flatMap((line) => line.roles).find((role) => role.roleCode === "FRONT")!;
    assert.equal(front.subcontracted, true);
    assert.equal(front.sellRateCents, 42_000);
    assert.equal(front.costRateCents, 43_000);
  });

  test("UI sous-traité à 400 € pour une vente à 420 € ne déclenche rien", () => {
    const selection = defaultSelectionFor("vitrine");
    selection.modules.find((m) => m.moduleKey === "vitrine-design")!.subcontractedRoles = ["UI"];
    const { alerts } = alertsFor(CATALOG_2027, selection, conditions());
    assert.equal(codes(alerts).some((code) => code.startsWith("subcontracting-loss")), false);
  });

  test("un rôle interne ne peut pas être sous-traité, même si on le coche", () => {
    const selection = defaultSelectionFor("vitrine");
    selection.modules.find((m) => m.moduleKey === "vitrine-cadrage")!.subcontractedRoles = ["STRAT"];
    const { result } = alertsFor(CATALOG_2027, selection, conditions());
    const strat = result.lines.flatMap((line) => line.roles).find((role) => role.roleCode === "STRAT")!;
    assert.equal(strat.subcontracted, false);
  });

  test("au-delà de 40 % de jours sous-traités, l'alerte de part se déclenche", () => {
    const selection = defaultSelectionFor("vitrine");
    for (const selected of selection.modules) {
      selected.subcontractedRoles = ["UX", "UI", "FRONT", "FULL", "MOTION"];
    }
    const { result, alerts } = alertsFor(CATALOG_2027, selection, conditions());
    assert.ok(result.subcontractedShareBp! > 4000);
    assert.ok(codes(alerts).includes("subcontracting-share"));
  });
});

// ── 9. Coût de revient ───────────────────────────────────────────────────

describe("9. Coût de revient", () => {
  test("2027, micro-entreprise : environ 301 € par jour", () => {
    const cost = computeCostOfSale(SETTINGS_2027);
    assert.equal(cost.dayRateCents, 30_066);
    assert.equal(cost.confirmed, true);
  });

  test("2028, société à l'IS : environ 427 € par jour", () => {
    const cost = computeCostOfSale(SETTINGS_2028);
    assert.equal(cost.dayRateCents, 42_692);
    assert.equal(cost.confirmed, false, "le taux TNS de 45 % reste à confirmer");
  });

  test("les cotisations micro s'assoient sur le CA, pas sur la rémunération", () => {
    // Si les deux formules étaient interchangeables, appliquer la formule IS
    // aux paramètres micro donnerait le même nombre. Elle donne 224 € contre
    // 301 € : l'écart est le piège que ce test verrouille.
    const asIs = computeCostOfSale({ ...SETTINGS_2027, regime: "is" });
    assert.notEqual(asIs.dayRateCents, 30_066);
    assert.ok(asIs.dayRateCents < 30_066);
  });

  test("un taux de cotisations de 100 % est refusé plutôt que de rendre l'infini", () => {
    assert.throws(() => computeCostOfSale({ ...SETTINGS_2027, contributionRateBp: 10_000 }));
  });

  test("un coût non confirmé est signalé", () => {
    const { alerts } = alertsFor(CATALOG_2028, defaultSelectionFor("vitrine"), conditions());
    assert.ok(codes(alerts).includes("cost-of-sale-unconfirmed"));
  });
});

// ── 10. Fraîcheur des références ─────────────────────────────────────────

describe("10. Fraîcheur des références", () => {
  test("une référence de plus de 180 jours déclenche le bandeau", () => {
    const { alerts } = alertsFor(CATALOG_2027, defaultSelectionFor("vitrine"), conditions(), {
      oldestBenchmarkConsultedAt: "2026-09-27",
      today: new Date("2027-06-01T12:00:00Z"),
    });
    assert.ok(codes(alerts).includes("benchmarks-stale"));
  });

  test("une référence de moins de 180 jours ne le déclenche pas", () => {
    const { alerts } = alertsFor(CATALOG_2027, defaultSelectionFor("vitrine"), conditions(), {
      oldestBenchmarkConsultedAt: "2026-09-27",
      today: new Date("2026-12-01T12:00:00Z"),
    });
    assert.equal(codes(alerts).includes("benchmarks-stale"), false);
  });
});

// ── Les lignes du devis ──────────────────────────────────────────────────

describe("Mapping vers le devis", () => {
  test("les lignes somment exactement au sous-total, mode round", () => {
    for (const offer of OFFERS.filter((o) => o.referencePriceCents !== null)) {
      const result = priceConfiguration(CATALOG_2027, defaultSelectionFor(offer.key), conditions());
      const draft = buildQuoteDraft(result, "round", []);
      assert.equal(sumLineItems(draft.lineItems), draft.subtotalCents, `${offer.key}, mode round`);
      assert.equal(draft.subtotalCents - draft.discountCents, draft.totalCents);
      assert.equal(draft.totalCents, result.priceExclVatCents);
    }
  });

  test("les lignes somment exactement au sous-total, mode module", () => {
    for (const offer of OFFERS.filter((o) => o.referencePriceCents !== null)) {
      const result = priceConfiguration(CATALOG_2027, defaultSelectionFor(offer.key), conditions());
      const draft = buildQuoteDraft(result, "module", []);
      assert.equal(sumLineItems(draft.lineItems), draft.subtotalCents, `${offer.key}, mode module`);
    }
  });

  test("une quantité supérieure à 1 ne fait pas dériver le total", () => {
    const selection = defaultSelectionFor("vitrine");
    selection.modules.push({ moduleKey: "opt-page-supplementaire", quantity: 7, subcontractedRoles: [] });
    selection.modules.push({ moduleKey: "opt-redaction", quantity: 3, subcontractedRoles: [] });

    const result = priceConfiguration(CATALOG_2027, selection, conditions());
    const draft = buildQuoteDraft(result, "module", []);
    assert.equal(sumLineItems(draft.lineItems), draft.subtotalCents);

    const pages = draft.lineItems.find((item) => item.description.includes("Page supplémentaire"))!;
    assert.equal(pages.quantity, 7, "la quantité reste lisible sur le devis");
  });

  test("avec une remise, l'identité sous-total moins remise égale total tient", () => {
    const result = priceConfiguration(
      CATALOG_2027,
      defaultSelectionFor("avance"),
      conditions({ discountBp: 750, discountReason: "Engagement sur deux projets" })
    );
    const draft = buildQuoteDraft(result, "round", []);
    assert.equal(sumLineItems(draft.lineItems) - draft.discountCents, result.priceExclVatCents);
  });

  test("les options sont chiffrées à part et n'entrent jamais dans le total", () => {
    const selection = defaultSelectionFor("landing");
    selection.options = [{ moduleKey: "opt-redaction", quantity: 4, subcontractedRoles: [] }];

    const result = priceConfiguration(CATALOG_2027, selection, conditions());
    const draft = buildQuoteDraft(result, "round", []);

    assert.equal(draft.optionLines.length, 1);
    assert.ok(draft.optionLines[0].unitPriceCents > 0);
    assert.equal(sumLineItems(draft.lineItems), draft.subtotalCents);
    // Le prix reste celui de la landing seule : 2 850 €.
    assert.equal(result.priceExclVatCents, 285_000);
  });

  test("un module à hypothèse pousse son texte dans le devis", () => {
    const selection = defaultSelectionFor("vitrine");
    selection.modules.push({ moduleKey: "opt-pages-legales", quantity: 1, subcontractedRoles: [] });
    const result = priceConfiguration(CATALOG_2027, selection, conditions());
    const draft = buildQuoteDraft(result, "round", ["Hypothèse de gabarit"]);

    assert.ok(draft.assumptions[0].includes("validation juridique"));
    assert.equal(draft.assumptions.at(-1), "Hypothèse de gabarit");
  });
});

// ── Ce que le calibrage dit vraiment de 2028 ─────────────────────────────

describe("Le passage en société", () => {
  test("quatre offres sur six passent sous la marge cible aux paramètres 2028", () => {
    const below = OFFERS.filter((offer) => offer.referencePriceCents !== null).filter((offer) => {
      const result = priceConfiguration(CATALOG_2028, defaultSelectionFor(offer.key), conditions());
      return result.marginBp !== null && result.marginBp < SETTINGS_2028.targetMarginBp;
    });

    // Ce n'est pas un défaut du moteur, c'est ce que la grille dit : le coût
    // de revient est multiplié par 1,42 quand l'indexation prévue le compense
    // de 1,05. Le test le verrouille pour qu'un changement de taux se voie.
    assert.deepEqual(
      below.map((offer) => offer.key).sort(),
      ["avance", "immersif", "outil", "vitrine"],
      "si cette liste change, c'est que les taux ou l'indexation ont bougé"
    );
  });

  test("les deux petites offres tiennent, grâce à la majoration petit projet", () => {
    for (const key of ["landing", "audit"]) {
      const result = priceConfiguration(CATALOG_2028, defaultSelectionFor(key), conditions());
      assert.ok(result.smallProjectApplied, `${key} devrait bénéficier de la majoration`);
      assert.ok(result.marginBp! >= SETTINGS_2028.targetMarginBp, `${key} passe sous la cible`);
    }
  });
});
