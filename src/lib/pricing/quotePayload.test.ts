import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { priceConfiguration } from "./engine.ts";
import { buildQuotePayload, type QuoteRecipient, type QuoteTexts } from "./quotePayload.ts";
import { buildCatalog, defaultSelectionFor, DEFAULT_CONDITIONS, SETTINGS_2027 } from "./testCatalog.ts";
import type { PricingConditions } from "./types.ts";

// Le test d'intégration de la spec §7 : « une configuration validée crée un
// devis dans le module existant, avec le bon nombre de lignes, les bons
// totaux et l'instantané JSON attaché ».
//
// Il s'arrête à la charge utile, délibérément. Un test qui insérerait
// vraiment aurait besoin d'une base, donc du réseau, et vérifierait surtout
// que PostgREST fonctionne. Ce qui peut casser ici, c'est le nombre de
// lignes, les totaux et le contenu du bloc PDF — et tout cela se vérifie
// sans base. L'écriture qui suit tient en un insert.

const CATALOG = buildCatalog(SETTINGS_2027);
const TODAY = new Date("2027-03-10T09:00:00Z");

const RECIPIENT: QuoteRecipient = {
  name: "Claire Martin",
  email: "claire@cabinet-martin.fr",
  company: "Cabinet Martin",
  address: { street: "12 rue de la Course", postalCode: "33000", city: "Bordeaux", country: "France" },
  siren: "123 456 789",
  vatNumber: "FR12123456789",
};

const TEXTS: QuoteTexts = {
  included: ["Les rounds de production listés ci-dessus, dans leur intégralité."],
  excluded: ["La rédaction des contenus, sauf module explicitement retenu."],
  assumptions: ["Les contenus sont fournis par le client avant le début du round R3."],
};

function conditions(overrides: Partial<PricingConditions> = {}): PricingConditions {
  return { ...DEFAULT_CONDITIONS, ...overrides };
}

describe("Configuration validée vers charge utile de devis", () => {
  test("le bon nombre de lignes et les bons totaux, mode round", () => {
    const cond = conditions();
    const result = priceConfiguration(CATALOG, defaultSelectionFor("vitrine"), cond);
    const payload = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);

    // Le site vitrine couvre R0 à R6 sans R2 ni R3 partagés : sept modules
    // sur sept rounds distincts, donc sept lignes.
    assert.equal(payload.lineItems.length, 7);

    const summed = payload.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
    assert.equal(summed, payload.subtotalCents);
    assert.equal(payload.subtotalCents - payload.discountCents, payload.totalCents);
    assert.equal(payload.totalCents, result.priceExclVatCents);
    assert.equal(payload.totalCents, 720_000);
    assert.equal(payload.discountCents, 0);
  });

  test("le mode module donne plus de lignes et exactement le même total", () => {
    const roundCond = conditions({ displayMode: "round" });
    const moduleCond = conditions({ displayMode: "module" });
    const selection = defaultSelectionFor("outil");

    const roundPayload = buildQuotePayload(
      priceConfiguration(CATALOG, selection, roundCond), roundCond, RECIPIENT, TEXTS, TODAY
    );
    const modulePayload = buildQuotePayload(
      priceConfiguration(CATALOG, selection, moduleCond), moduleCond, RECIPIENT, TEXTS, TODAY
    );

    // L'outil métier a deux modules en R0 : huit modules pour sept rounds.
    assert.equal(roundPayload.lineItems.length, 7);
    assert.equal(modulePayload.lineItems.length, 8);
    assert.equal(roundPayload.totalCents, modulePayload.totalCents);

    for (const payload of [roundPayload, modulePayload]) {
      const summed = payload.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
      assert.equal(summed, payload.subtotalCents);
    }
  });

  test("la remise sort du sous-total, et l'identité tient au centime", () => {
    const cond = conditions({ discountBp: 750, discountReason: "Engagement sur deux projets" });
    const result = priceConfiguration(CATALOG, defaultSelectionFor("avance"), cond);
    const payload = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);

    assert.ok(payload.discountCents > 0);
    const summed = payload.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
    assert.equal(summed - payload.discountCents, payload.totalCents);
  });

  test("la validité se calcule, elle ne se saisit pas", () => {
    const cond = conditions({ validityDays: 30 });
    const result = priceConfiguration(CATALOG, defaultSelectionFor("landing"), cond);
    const payload = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);
    assert.equal(payload.validUntil, "2027-04-09");
  });

  test("la raison sociale prime sur le nom de la personne", () => {
    const cond = conditions();
    const result = priceConfiguration(CATALOG, defaultSelectionFor("landing"), cond);

    const withCompany = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);
    assert.equal(withCompany.recipientName, "Cabinet Martin");

    // Un lead sans société garde son nom, et n'invente ni adresse ni SIREN.
    const lead: QuoteRecipient = { ...RECIPIENT, company: null, address: null, siren: null, vatNumber: null };
    const withoutCompany = buildQuotePayload(result, cond, lead, TEXTS, TODAY);
    assert.equal(withoutCompany.recipientName, "Claire Martin");
    assert.equal(withoutCompany.recipientAddress, null);
    assert.equal(withoutCompany.recipientSiren, null);
  });
});

describe("Le bloc imprimé sur le PDF", () => {
  test("en franchise, aucun taux et la mention est portée", () => {
    const cond = conditions();
    const result = priceConfiguration(CATALOG, defaultSelectionFor("vitrine"), cond);
    const payload = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);

    assert.equal(payload.pricing.vatRateBp, 0);
    assert.equal(payload.pricing.vatAmountCents, 0);
    assert.equal(payload.pricing.totalInclVatCents, payload.totalCents);
    assert.equal(payload.pricing.vatExemptionMention, "TVA non applicable, art. 293 B du CGI");
  });

  test("assujetti, le TTC du bloc est celui des échéances", () => {
    const catalog = buildCatalog({ ...SETTINGS_2027, vatRegime: "standard" });
    const cond = conditions();
    const result = priceConfiguration(catalog, defaultSelectionFor("vitrine"), cond);
    const payload = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);

    assert.equal(payload.pricing.vatRateBp, 2000);
    assert.equal(payload.pricing.vatExemptionMention, null);
    assert.equal(payload.pricing.totalInclVatCents, payload.totalCents + payload.pricing.vatAmountCents);

    const scheduled = payload.pricing.schedule.reduce((sum, entry) => sum + entry.amountCents, 0);
    assert.equal(scheduled, payload.pricing.totalInclVatCents);
  });

  test("les options sont dans le bloc, jamais dans les lignes", () => {
    const cond = conditions();
    const selection = defaultSelectionFor("landing");
    selection.options = [{ moduleKey: "opt-redaction", quantity: 4, subcontractedRoles: [] }];

    const result = priceConfiguration(CATALOG, selection, cond);
    const payload = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);

    assert.equal(payload.pricing.options.length, 1);
    assert.ok(payload.pricing.options[0].unitPriceCents > 0);
    assert.equal(
      payload.lineItems.some((item) => item.description.includes("Rédaction")),
      false
    );
    // La landing seule vaut 2 850 € : l'option ne l'a pas déplacée.
    assert.equal(payload.totalCents, 285_000);
  });

  test("l'hypothèse d'un module retenu passe avant les gabarits", () => {
    const cond = conditions();
    const selection = defaultSelectionFor("vitrine");
    selection.modules.push({ moduleKey: "opt-pages-legales", quantity: 1, subcontractedRoles: [] });

    const result = priceConfiguration(CATALOG, selection, cond);
    const payload = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);

    assert.ok(payload.pricing.assumptions[0].includes("validation juridique"));
    assert.equal(payload.pricing.assumptions.at(-1), TEXTS.assumptions[0]);
    assert.deepEqual(payload.pricing.included, TEXTS.included);
    assert.deepEqual(payload.pricing.excluded, TEXTS.excluded);
  });

  test("les échéances somment exactement au TTC, pour chaque offre", () => {
    const cond = conditions();
    for (const key of ["landing", "vitrine", "avance", "outil", "immersif", "audit"]) {
      const result = priceConfiguration(CATALOG, defaultSelectionFor(key), cond);
      const payload = buildQuotePayload(result, cond, RECIPIENT, TEXTS, TODAY);
      const scheduled = payload.pricing.schedule.reduce((sum, entry) => sum + entry.amountCents, 0);
      assert.equal(scheduled, payload.pricing.totalInclVatCents, `${key} : les échéances ne tombent pas juste`);
    }
  });

  test("un devis dont les lignes ne sommeraient pas est refusé plutôt qu'envoyé", () => {
    const cond = conditions();
    const result = priceConfiguration(CATALOG, defaultSelectionFor("vitrine"), cond);

    // On sabote l'invariant : le garde-fou doit lever, pas laisser passer.
    const broken = { ...result, preDiscountCents: result.preDiscountCents + 1 };
    assert.throws(
      () => buildQuotePayload(broken, cond, RECIPIENT, TEXTS, TODAY),
      /ne tombe pas sur le total|L'allocation est cassée|somment/
    );
  });
});
