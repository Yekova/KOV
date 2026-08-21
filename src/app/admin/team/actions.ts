"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { inviteUser } from "@/lib/auth/inviteUser";
import { adminInviteEmailHtml, adminInviteEmailSubject } from "@/lib/email/inviteEmail";

export async function deactivateAdmin(adminId: string) {
  const admin = await requireAdmin();
  if (adminId === admin.id) throw new Error("Vous ne pouvez pas désactiver votre propre compte.");

  const { count: activeAdminCount } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .is("archived_at", null);
  if ((activeAdminCount ?? 0) <= 1) throw new Error("Impossible de désactiver le dernier compte admin actif.");

  // ban_duration invalidates the session on Supabase's side immediately —
  // requireUser() already calls auth.getUser(), which round-trips to GoTrue
  // on every request, so access is cut without any extra query on our side.
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(adminId, { ban_duration: "876000h" });
  if (authError) throw new Error("La désactivation a échoué.");

  const { error } = await supabaseAdmin.from("profiles").update({ archived_at: new Date().toISOString() }).eq("id", adminId);
  if (error) throw new Error("La désactivation a échoué.");

  revalidatePath("/admin/team");
}

export async function reactivateAdmin(adminId: string) {
  await requireAdmin();

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(adminId, { ban_duration: "none" });
  if (authError) throw new Error("La réactivation a échoué.");

  const { error } = await supabaseAdmin.from("profiles").update({ archived_at: null }).eq("id", adminId);
  if (error) throw new Error("La réactivation a échoué.");

  revalidatePath("/admin/team");
}

export async function inviteAdmin(formData: FormData) {
  await requireAdmin();

  const email = formData.get("email");
  const fullName = formData.get("full_name");
  const displayTitle = formData.get("display_title");

  if (typeof email !== "string" || !email.trim()) throw new Error("Email requis.");

  const fullNameValue = typeof fullName === "string" && fullName.trim() ? fullName.trim() : null;

  const { userId } = await inviteUser({
    email: email.trim(),
    fullName: fullNameValue,
    role: "admin",
    emailSubject: adminInviteEmailSubject(),
    emailHtml: (actionLink) => adminInviteEmailHtml({ fullName: fullNameValue, actionLink }),
  });

  if (typeof displayTitle === "string" && displayTitle.trim()) {
    await supabaseAdmin.from("profiles").update({ display_title: displayTitle.trim() }).eq("id", userId);
  }

  revalidatePath("/admin/team");
}
