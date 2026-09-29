"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type LoginState = {
  error: string | null;
};

function safeNextPath(value: FormDataEntryValue | null) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return null;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: "Merci de renseigner un email et un mot de passe." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Identifiants incorrects." };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const next = safeNextPath(formData.get("next"));
  redirect(next ?? (profile?.role === "admin" ? "/admin" : "/client"));
}

// Se déconnecter, et cesser d'apparaître en ligne.
//
// Sans cette mise à jour, un admin qui ferme sa session restait « En ligne »
// pour ses clients jusqu'à sa prochaine visite — le portail affiche sa
// pastille sur la carte « votre chef de projet » et sur la page Équipe.
//
// L'écriture passe avant signOut() : après, il n'y a plus de session d'où
// tirer l'identité. Et elle ne fait pas échouer la déconnexion si elle
// échoue elle-même : rester connecté parce qu'un drapeau n'a pas pu
// s'écrire serait le pire des deux maux.
export async function logout() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await supabaseAdmin.from("profiles").update({ is_online: false }).eq("id", user.id);
    } catch {
      // Sans importance : la déconnexion prime.
    }
  }

  // scope "global" et non le défaut implicite : il révoque TOUS les jetons
  // de rafraîchissement de ce compte, pas seulement celui de cet appareil.
  // Sans lui, une session ouverte sur un autre navigateur — ou l'onglet
  // resté ouvert sur un poste partagé — continue de se renouveler toute
  // seule. « Se déconnecter » doit vouloir dire partout.
  await supabase.auth.signOut({ scope: "global" });

  // Le cache de route de Next survit à la déconnexion.
  //
  // C'est ce qui donnait l'impression de ne pas être vraiment déconnecté :
  // le serveur ne renvoyait plus rien, mais le navigateur gardait en
  // mémoire le rendu des pages déjà visitées et les réaffichait au bouton
  // « précédent ». On revoyait donc son tableau de bord, figé, sans y
  // avoir droit. Purger la racine en mode "layout" vide cette mémoire pour
  // toute l'application.
  revalidatePath("/", "layout");

  redirect("/login");
}
