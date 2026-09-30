import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { EMPTY_ONBOARDING, stepIsDone, type OnboardingState, type OnboardingStep } from "./onboardingSteps";

// Le parcours de première connexion.
//
// Cinq étapes, et une seule est obligatoire : la sécurité. Le cahier des
// charges le demande (§41), et c'est aussi la seule qui laisse le compte
// dans un état différent selon qu'on l'a franchie ou non — les quatre
// autres ne font que montrer.
//
// L'état est repris là où il s'est arrêté (§40) : les horodatages disent
// ce qui est fait, donc revenir trois jours plus tard reprend au même
// endroit sans qu'on ait à conserver quoi que ce soit dans le navigateur.

export {
  ONBOARDING_STEPS,
  STEP_LABELS,
  EMPTY_ONBOARDING,
  resumeAt,
  needsOnboarding,
  stepIsDone,
} from "./onboardingSteps";
export type { OnboardingStep, OnboardingState } from "./onboardingSteps";

export async function getOnboarding(clientId: string): Promise<OnboardingState> {
  const { data } = await supabaseAdmin
    .from("client_onboarding")
    .select("welcome_seen_at, profile_verified_at, security_done_at, project_seen_at, validation_seen_at, completed_at")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!data) return EMPTY_ONBOARDING;
  return {
    welcomeSeenAt: data.welcome_seen_at,
    profileVerifiedAt: data.profile_verified_at,
    securityDoneAt: data.security_done_at,
    projectSeenAt: data.project_seen_at,
    validationSeenAt: data.validation_seen_at,
    completedAt: data.completed_at,
  };
}

const COLUMNS: Record<Exclude<OnboardingStep, "done">, string> = {
  welcome: "welcome_seen_at",
  profile: "profile_verified_at",
  security: "security_done_at",
  project: "project_seen_at",
};

/** Marquer une étape franchie. Idempotent : repasser sur une étape déjà
 *  faite ne déplace pas son horodatage — la date du premier passage est
 *  celle qui a un sens. */
export async function markStep(clientId: string, step: Exclude<OnboardingStep, "done">): Promise<void> {
  const column = COLUMNS[step];
  const now = new Date().toISOString();

  // On relit l'état complet plutôt qu'une colonne nommée à l'exécution :
  // PostgREST ne sait pas typer un `select` dont le nom vient d'une
  // variable, et getOnboarding fait déjà cette lecture proprement.
  const existing = await getOnboarding(clientId);
  if (stepIsDone(existing, step)) return;

  await supabaseAdmin
    .from("client_onboarding")
    .upsert({ client_id: clientId, [column]: now, updated_at: now }, { onConflict: "client_id" });
}

export async function markValidationSeen(clientId: string): Promise<void> {
  const now = new Date().toISOString();
  await supabaseAdmin
    .from("client_onboarding")
    .upsert({ client_id: clientId, validation_seen_at: now, updated_at: now }, { onConflict: "client_id" });
}

/**
 * Clore le parcours.
 *
 * La sécurité est vérifiée ici et non dans l'interface : un formulaire se
 * contourne, une action serveur non. Sans elle, un client pourrait finir
 * son parcours en gardant le mot de passe que le lien d'invitation lui a
 * laissé — c'est-à-dire aucun.
 */
export async function completeOnboarding(clientId: string): Promise<{ error?: string }> {
  const state = await getOnboarding(clientId);
  if (!state.securityDoneAt) {
    return { error: "Définissez d'abord votre mot de passe." };
  }
  if (state.completedAt) return {};

  const now = new Date().toISOString();
  await supabaseAdmin
    .from("client_onboarding")
    .upsert({ client_id: clientId, completed_at: now, updated_at: now }, { onConflict: "client_id" });
  return {};
}
