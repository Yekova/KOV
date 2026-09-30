"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/activity";
import { completeOnboarding, markStep } from "@/lib/clients/onboarding";
import { passwordProblem } from "@/lib/clients/password";

// Les écritures du parcours de première connexion.
//
// Chacune relit l'identité depuis la session : rien de ce que le
// navigateur envoie ne dit QUI agit. C'est la règle de toutes les actions
// de ce projet, et elle compte doublement ici, où l'une d'elles définit un
// mot de passe.

type Result = { error?: string };

export async function seeWelcome(): Promise<Result> {
  const user = await requireUser();
  await markStep(user.id, "welcome");
  revalidatePath("/client/onboarding");
  return {};
}

/** « Tout est correct » : on n'écrit rien d'autre que la confirmation.
 *  Le client n'a pas à modifier ce qui est déjà juste. */
export async function confirmProfile(): Promise<Result> {
  const user = await requireUser();
  await markStep(user.id, "profile");
  revalidatePath("/client/onboarding");
  return {};
}

export async function updateAndConfirmProfile(formData: FormData): Promise<Result> {
  const user = await requireUser();

  const fullName = formData.get("full_name");
  if (typeof fullName !== "string" || !fullName.trim()) {
    return { error: "Le nom est obligatoire." };
  }

  const optional = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName.trim(),
      company: optional("company"),
      phone: optional("phone"),
      display_title: optional("display_title"),
      address_street: optional("address_street"),
      address_postal_code: optional("address_postal_code"),
      address_city: optional("address_city"),
      address_country: optional("address_country"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "L'enregistrement a échoué." };

  await markStep(user.id, "profile");
  revalidatePath("/client/onboarding");
  revalidatePath("/client", "layout");
  return {};
}

/**
 * Définir le mot de passe, la première fois.
 *
 * Il passe par le serveur plutôt que par le client de navigateur, pour une
 * raison précise : c'est la seule façon pour l'application de SAVOIR qu'il
 * a été défini. Avec un appel depuis le navigateur, le serveur devrait
 * croire sur parole une requête qui dit « c'est fait » — et l'étape
 * obligatoire du parcours deviendrait une formalité qu'on contourne avec
 * la console.
 *
 * Le mot de passe n'est ni journalisé, ni conservé, ni renvoyé. Il est
 * transmis à Supabase Auth, qui le hache, et la variable sort de portée.
 */
export async function setInitialPassword(password: string, confirmation: string): Promise<Result> {
  const user = await requireUser();

  if (password !== confirmation) return { error: "Les deux mots de passe ne correspondent pas." };
  const problem = passwordProblem(password);
  if (problem) return { error: problem };

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
  if (error) {
    // Le message de Supabase peut contenir la raison du refus ; il ne
    // contient jamais le mot de passe.
    console.error("[onboarding] mot de passe", error.message);
    return { error: "Le mot de passe n'a pas pu être enregistré." };
  }

  await markStep(user.id, "security");
  revalidatePath("/client/onboarding");
  return {};
}

export async function seeProject(): Promise<Result> {
  const user = await requireUser();
  await markStep(user.id, "project");
  revalidatePath("/client/onboarding");
  return {};
}

export async function finishOnboarding(): Promise<Result> {
  const user = await requireUser();
  const result = await completeOnboarding(user.id);
  if (result.error) return result;

  // Le studio apprend que l'espace est vivant (§43). Le titre côté client
  // dit « vous », celui du studio nomme la personne — deux phrases pour le
  // même fait, comme partout ailleurs dans activity_log.
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, company")
    .eq("id", user.id)
    .maybeSingle();
  const who = profile?.full_name || profile?.company || "Un client";

  await logActivity({
    clientId: user.id,
    type: "milestone",
    title: "Votre espace KOV est activé",
    adminTitle: `${who} a activé son espace client`,
    actorId: user.id,
  });

  revalidatePath("/client", "layout");
  revalidatePath("/admin");
  return {};
}
