import { test } from "node:test";
import assert from "node:assert/strict";
import { AVATAR_PRESETS, isPresetAvatarPath, resolvePresetPath } from "./avatarPresets.ts";

// Cette liste est une frontière de sécurité, pas une commodité.
//
// Le choix d'avatar arrive du navigateur et finit dans
// profiles.avatar_path. Sans la validation, un formulaire bricolé
// écrirait n'importe quelle clé — par exemple celle de la photo d'un
// autre client, qui s'afficherait alors comme la sienne et que le
// remplacement suivant effacerait chez son propriétaire.
//
// D'où des tests sur les refus, pas seulement sur les acceptations.

test("les sept avatars proposés sont acceptés", () => {
  assert.equal(AVATAR_PRESETS.length, 7);
  for (const preset of AVATAR_PRESETS) {
    assert.equal(resolvePresetPath(preset.path), preset.path);
    assert.equal(isPresetAvatarPath(preset.path), true);
  }
});

test("la clé d'un avatar téléversé est refusée", () => {
  // La forme réelle d'un avatar déposé par quelqu'un.
  const someoneElse = "avatars/1f13df33-1827-4fa4-b3c8-387895653df6-1790759242683.jpg";
  assert.equal(resolvePresetPath(someoneElse), null);
  assert.equal(isPresetAvatarPath(someoneElse), false);
});

test("une valeur approchante est refusée", () => {
  for (const near of [
    "/kov/avatars/kov-08.webp", // n'existe pas
    "/kov/avatars/kov-01.png", // mauvaise extension
    "kov/avatars/kov-01.webp", // barre initiale manquante
    "/kov/avatars/../../../etc/passwd",
    "https://ailleurs.example/kov-01.webp",
  ]) {
    assert.equal(resolvePresetPath(near), null, near);
  }
});

test("une valeur absente ou d'un autre type est refusée sans lever", () => {
  for (const bad of [null, undefined, "", 42, {}, []]) {
    assert.equal(resolvePresetPath(bad), null);
  }
  assert.equal(isPresetAvatarPath(null), false);
  assert.equal(isPresetAvatarPath(undefined), false);
});

test("chaque avatar a un identifiant, un chemin et un libellé distincts", () => {
  const ids = new Set(AVATAR_PRESETS.map((p) => p.id));
  const paths = new Set(AVATAR_PRESETS.map((p) => p.path));
  const labels = new Set(AVATAR_PRESETS.map((p) => p.label));
  assert.equal(ids.size, 7);
  assert.equal(paths.size, 7);
  // Deux libellés identiques rendraient deux vignettes indiscernables
  // pour qui navigue au lecteur d'écran.
  assert.equal(labels.size, 7);
});

test("tous les chemins pointent vers le dossier statique, jamais vers le bucket", () => {
  // C'est ce préfixe qui empêche getPublicAssetUrl de les envoyer au
  // bucket, et deletePortalAsset de tenter de les supprimer.
  for (const preset of AVATAR_PRESETS) {
    assert.ok(preset.path.startsWith("/kov/avatars/"), preset.path);
  }
});
