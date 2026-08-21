"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { inviteUser } from "@/lib/auth/inviteUser";
import { adminInviteEmailHtml, adminInviteEmailSubject } from "@/lib/email/inviteEmail";

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
