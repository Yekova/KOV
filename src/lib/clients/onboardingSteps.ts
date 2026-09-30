// Le vocabulaire du parcours d'accueil — SANS "server-only".
//
// Le stepper est un composant de navigateur : il lui faut les étapes et
// leurs libellés. Les laisser dans onboarding.ts, qui importe
// supabaseAdmin, entraînerait la clé de service dans le paquet client —
// l'import échoue d'ailleurs au build, ce qui est la bonne façon
// d'échouer.
//
// Ce fichier ne contient donc que ce qui est pur : des constantes et des
// fonctions qui ne lisent rien.

export const ONBOARDING_STEPS = ["welcome", "profile", "security", "project", "done"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: "Bienvenue",
  profile: "Vos informations",
  security: "Sécurité",
  project: "Votre projet",
  done: "Terminé",
};

export interface OnboardingState {
  welcomeSeenAt: string | null;
  profileVerifiedAt: string | null;
  securityDoneAt: string | null;
  projectSeenAt: string | null;
  validationSeenAt: string | null;
  completedAt: string | null;
}

export const EMPTY_ONBOARDING: OnboardingState = {
  welcomeSeenAt: null,
  profileVerifiedAt: null,
  securityDoneAt: null,
  projectSeenAt: null,
  validationSeenAt: null,
  completedAt: null,
};

/** L'étape où reprendre : la première non franchie, dans l'ordre. */
export function resumeAt(state: OnboardingState): OnboardingStep {
  if (state.completedAt) return "done";
  if (!state.welcomeSeenAt) return "welcome";
  if (!state.profileVerifiedAt) return "profile";
  if (!state.securityDoneAt) return "security";
  if (!state.projectSeenAt) return "project";
  return "done";
}

/** Vrai quand le parcours reste à faire. Lu par la redirection du tableau
 *  de bord : tant que c'est vrai, le client y est renvoyé. */
export function needsOnboarding(state: OnboardingState): boolean {
  return state.completedAt === null;
}

export function stepIsDone(state: OnboardingState, step: Exclude<OnboardingStep, "done">): boolean {
  if (step === "welcome") return state.welcomeSeenAt !== null;
  if (step === "profile") return state.profileVerifiedAt !== null;
  if (step === "security") return state.securityDoneAt !== null;
  return state.projectSeenAt !== null;
}
