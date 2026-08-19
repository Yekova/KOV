"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function setOwnOnlineStatus(isOnline: boolean) {
  const user = await requireAdmin();

  const { error } = await supabaseAdmin.from("profiles").update({ is_online: isOnline }).eq("id", user.id);

  if (error) {
    throw new Error("La mise à jour du statut a échoué.");
  }

  revalidatePath("/admin");
  revalidatePath("/client");
}
