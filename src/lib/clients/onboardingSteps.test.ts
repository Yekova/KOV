import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  EMPTY_ONBOARDING,
  needsOnboarding,
  ONBOARDING_STEPS,
  resumeAt,
  STEP_LABELS,
  stepIsDone,
  type OnboardingState,
} from "./onboardingSteps.ts";

// Ces fonctions décident si quelqu'un est renvoyé dans un parcours
// d'accueil. Se tromper dans un sens enferme un client dans un tunnel
// qu'il a déjà fait ; dans l'autre, un nouveau client arrive sur un
// espace vide sans mot de passe.

const T = "2026-10-01T10:00:00.000Z";

function state(partial: Partial<OnboardingState>): OnboardingState {
  return { ...EMPTY_ONBOARDING, ...partial };
}

describe("Où reprendre", () => {
  test("un parcours vierge commence au début", () => {
    assert.equal(resumeAt(EMPTY_ONBOARDING), "welcome");
  });

  test("chaque étape franchie fait avancer d'un cran", () => {
    assert.equal(resumeAt(state({ welcomeSeenAt: T })), "profile");
    assert.equal(resumeAt(state({ welcomeSeenAt: T, profileVerifiedAt: T })), "security");
    assert.equal(resumeAt(state({ welcomeSeenAt: T, profileVerifiedAt: T, securityDoneAt: T })), "project");
    assert.equal(
      resumeAt(state({ welcomeSeenAt: T, profileVerifiedAt: T, securityDoneAt: T, projectSeenAt: T })),
      "done"
    );
  });

  test("un parcours terminé reste terminé, même incomplet en chemin", () => {
    // Le rattrapage de la migration produit exactement cette forme :
    // terminé, mais profile_verified_at nul, parce que personne n'a rien
    // confirmé. Sans ce test, un client rattrapé serait renvoyé à l'étape
    // « Vos informations » à chaque visite.
    const rattrape = state({ welcomeSeenAt: T, securityDoneAt: T, projectSeenAt: T, completedAt: T });
    assert.equal(resumeAt(rattrape), "done");
    assert.equal(needsOnboarding(rattrape), false);
  });

  test("un trou au milieu ramène au trou, pas à la fin", () => {
    // Quelqu'un qui a vu l'accueil et son projet mais n'a jamais défini de
    // mot de passe doit revenir sur la sécurité.
    assert.equal(resumeAt(state({ welcomeSeenAt: T, profileVerifiedAt: T, projectSeenAt: T })), "security");
  });
});

describe("Qui doit faire le parcours", () => {
  test("tant que completed_at est nul, oui", () => {
    assert.equal(needsOnboarding(EMPTY_ONBOARDING), true);
    assert.equal(needsOnboarding(state({ welcomeSeenAt: T, securityDoneAt: T })), true);
  });

  test("dès qu'il est posé, non", () => {
    assert.equal(needsOnboarding(state({ completedAt: T })), false);
  });
});

describe("Une étape déjà franchie", () => {
  test("se reconnaît pour chacune des quatre", () => {
    assert.equal(stepIsDone(state({ welcomeSeenAt: T }), "welcome"), true);
    assert.equal(stepIsDone(state({ profileVerifiedAt: T }), "profile"), true);
    assert.equal(stepIsDone(state({ securityDoneAt: T }), "security"), true);
    assert.equal(stepIsDone(state({ projectSeenAt: T }), "project"), true);
  });

  test("ne se confond pas avec une autre", () => {
    const onlyWelcome = state({ welcomeSeenAt: T });
    assert.equal(stepIsDone(onlyWelcome, "profile"), false);
    assert.equal(stepIsDone(onlyWelcome, "security"), false);
    assert.equal(stepIsDone(onlyWelcome, "project"), false);
  });

  test("l'idempotence tient : c'est ce qui empêche markStep de déplacer une date", () => {
    // markStep s'arrête si stepIsDone est vrai. Si cette fonction mentait,
    // revenir sur une étape réécrirait son horodatage, et profile_verified_at
    // ne dirait plus QUAND le client a confirmé.
    for (const step of ["welcome", "profile", "security", "project"] as const) {
      assert.equal(stepIsDone(EMPTY_ONBOARDING, step), false, step);
    }
  });
});

describe("Le vocabulaire", () => {
  test("chaque étape a un libellé, et ils sont distincts", () => {
    assert.equal(ONBOARDING_STEPS.length, 5);
    const labels = ONBOARDING_STEPS.map((step) => STEP_LABELS[step]);
    assert.ok(labels.every(Boolean));
    assert.equal(new Set(labels).size, 5);
  });

  test("resumeAt ne rend jamais autre chose qu'une étape connue", () => {
    const combinations: OnboardingState[] = [
      EMPTY_ONBOARDING,
      state({ welcomeSeenAt: T }),
      state({ profileVerifiedAt: T }),
      state({ securityDoneAt: T }),
      state({ projectSeenAt: T }),
      state({ completedAt: T }),
      state({ welcomeSeenAt: T, profileVerifiedAt: T, securityDoneAt: T, projectSeenAt: T, completedAt: T }),
    ];
    for (const value of combinations) {
      assert.ok(ONBOARDING_STEPS.includes(resumeAt(value)));
    }
  });
});
