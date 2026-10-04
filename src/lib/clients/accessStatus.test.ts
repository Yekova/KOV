import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ACCESS_COLORS, ACCESS_LABELS, ACCESS_STATUSES, deriveAccessStatus, type AuthFacts } from "./accessStatus.ts";

// Le statut d'accès n'est stocké nulle part : il est déduit de auth.users
// à chaque lecture. C'est ce qui le rend toujours juste — à condition que
// la déduction, elle, le soit.
//
// Les cas limites viennent des vraies données de ce projet : un compte
// banni jusqu'en 2126, un compte connecté sans email confirmé, un compte
// invité qui n'est jamais venu.

const PASSE = "2020-01-01T00:00:00.000Z";
const FUTUR = "2126-08-31T07:49:55.980Z";
const QUAND = "2026-09-30T17:45:19.946Z";

function facts(partial: Partial<AuthFacts>): AuthFacts {
  return { invitedAt: null, confirmedAt: null, lastSignInAt: null, bannedUntil: null, ...partial };
}

describe("La déduction du statut", () => {
  test("aucun compte derrière le profil : rien n'a été créé", () => {
    assert.equal(deriveAccessStatus(null, null), "pending");
  });

  test("invité, jamais venu", () => {
    assert.equal(deriveAccessStatus(facts({ invitedAt: QUAND }), null), "invited");
  });

  test("email confirmé : actif", () => {
    assert.equal(deriveAccessStatus(facts({ invitedAt: QUAND, confirmedAt: QUAND }), null), "active");
  });

  test("connecté sans email confirmé : actif quand même", () => {
    // Un compte antérieur à l'exigence de confirmation s'est connecté sans
    // jamais être confirmé. Le dire « invité » enverrait le studio
    // relancer quelqu'un qui utilise son espace tous les jours.
    assert.equal(deriveAccessStatus(facts({ lastSignInAt: QUAND }), null), "active");
  });

  test("banni dans le futur : suspendu, même s'il s'est connecté hier", () => {
    // C'est l'état réel d'un des comptes de ce projet : banni jusqu'en
    // 2126. Une connexion passée ne le rend pas accessible aujourd'hui.
    assert.equal(
      deriveAccessStatus(facts({ confirmedAt: QUAND, lastSignInAt: QUAND, bannedUntil: FUTUR }), null),
      "suspended"
    );
  });

  test("un bannissement expiré ne suspend plus rien", () => {
    assert.equal(deriveAccessStatus(facts({ lastSignInAt: QUAND, bannedUntil: PASSE }), null), "active");
  });

  test("archivé : retiré, quoi que dise le compte", () => {
    // L'archivage est une décision du studio. Un client archivé dont le
    // compte reste parfaitement actif n'est pas « actif » : il est retiré.
    assert.equal(deriveAccessStatus(facts({ confirmedAt: QUAND, lastSignInAt: QUAND }), QUAND), "revoked");
    assert.equal(deriveAccessStatus(null, QUAND), "revoked");
  });

  test("l'archivage prime sur la suspension", () => {
    assert.equal(deriveAccessStatus(facts({ bannedUntil: FUTUR }), QUAND), "revoked");
  });

  test("le « maintenant » est injectable, donc le test ne pourrit pas", () => {
    // Sans ce paramètre, ce test cesserait de vérifier quoi que ce soit le
    // jour où la date du bannissement serait dépassée.
    const banniJusquEn2027 = facts({ lastSignInAt: QUAND, bannedUntil: "2027-01-01T00:00:00.000Z" });
    assert.equal(deriveAccessStatus(banniJusquEn2027, null, new Date("2026-06-01")), "suspended");
    assert.equal(deriveAccessStatus(banniJusquEn2027, null, new Date("2028-06-01")), "active");
  });
});

describe("Le vocabulaire", () => {
  test("chaque statut a un libellé et une couleur", () => {
    for (const status of ACCESS_STATUSES) {
      assert.ok(ACCESS_LABELS[status], status);
      assert.ok(ACCESS_COLORS[status], status);
    }
  });

  test("les libellés sont distincts : deux états identiques à l'écran ne servent à rien", () => {
    assert.equal(new Set(ACCESS_STATUSES.map((s) => ACCESS_LABELS[s])).size, ACCESS_STATUSES.length);
  });

  test("la déduction ne rend jamais un statut hors de la liste", () => {
    const cases: [AuthFacts | null, string | null][] = [
      [null, null],
      [facts({}), null],
      [facts({ invitedAt: QUAND }), null],
      [facts({ confirmedAt: QUAND }), null],
      [facts({ bannedUntil: FUTUR }), null],
      [facts({ confirmedAt: QUAND }), QUAND],
    ];
    for (const [f, archived] of cases) {
      assert.ok(ACCESS_STATUSES.includes(deriveAccessStatus(f, archived)));
    }
  });
});
