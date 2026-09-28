"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveAvatarPath } from "@/lib/portal/avatar";

export async function updateMyProfile(formData: FormData) {
  const user = await requireUser();

  const fullName = formData.get("full_name");
  const company = formData.get("company");

  if (typeof fullName !== "string" || !fullName.trim()) throw new Error("Nom requis.");

  const { data: current } = await supabaseAdmin.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle();
  const avatarPath = await resolveAvatarPath(user.id, formData, current?.avatar_path ?? null);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName.trim(),
      company: typeof company === "string" && company.trim() ? company.trim() : null,
      ...(avatarPath === undefined ? {} : { avatar_path: avatarPath }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error("L'enregistrement a échoué.");

  revalidatePath("/client/profile");
  // La photo s'affiche dans la barre du haut, qui vit dans le layout :
  // sans le second argument, on la changerait sans la voir changer.
  revalidatePath("/client", "layout");
}
