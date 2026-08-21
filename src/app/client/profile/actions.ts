"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function updateMyProfile(formData: FormData) {
  const user = await requireUser();

  const fullName = formData.get("full_name");
  const company = formData.get("company");

  if (typeof fullName !== "string" || !fullName.trim()) throw new Error("Nom requis.");

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: fullName.trim(),
      company: typeof company === "string" && company.trim() ? company.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error("L'enregistrement a échoué.");

  revalidatePath("/client/profile");
  revalidatePath("/client");
}
