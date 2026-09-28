"use server";

import { redirect } from "next/navigation";
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

  await supabase.auth.signOut();
  redirect("/login");
}
