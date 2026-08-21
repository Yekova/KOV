"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isLeadStatus } from "@/lib/admin/status";
import { inviteUser } from "@/lib/auth/inviteUser";
import { clientInviteEmailHtml, clientInviteEmailSubject } from "@/lib/email/inviteEmail";
import { logActivity, getActorDisplayName } from "@/lib/activity";

// Note: leads have no client_id (they're pre-signature prospects, not
// linked to a profiles row), so lead events are never written to
// activity_log — that table's client_id is NOT NULL. Leads get their own
// "Leads récents" feed on the dashboard instead.

export async function updateLeadStatus(leadId: string, status: string) {
  await requireAdmin();

  if (!isLeadStatus(status)) {
    throw new Error("Statut invalide.");
  }

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    throw new Error("La mise à jour du statut a échoué.");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
}

export async function assignLead(leadId: string, formData: FormData) {
  await requireAdmin();

  const assignedTo = formData.get("assigned_to");
  const value = typeof assignedTo === "string" && assignedTo ? assignedTo : null;

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ assigned_to: value, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) throw new Error("L'attribution a échoué.");

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
}

export async function updateLeadNotes(leadId: string, formData: FormData) {
  await requireAdmin();

  const notes = formData.get("notes");

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ notes: typeof notes === "string" ? notes : null, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) throw new Error("L'enregistrement des notes a échoué.");

  revalidatePath(`/admin/leads/${leadId}`);
}

export async function convertLeadToClient(leadId: string) {
  const admin = await requireAdmin();

  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("name, email, company, converted_profile_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) throw new Error("Lead introuvable.");
  if (lead.converted_profile_id) throw new Error("Ce lead a déjà été converti en client.");

  const { userId } = await inviteUser({
    email: lead.email,
    fullName: lead.name,
    role: "client",
    emailSubject: clientInviteEmailSubject(),
    emailHtml: (actionLink) => clientInviteEmailHtml({ fullName: lead.name, actionLink }),
  });

  if (lead.company) {
    await supabaseAdmin.from("profiles").update({ company: lead.company }).eq("id", userId);
  }

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ converted_profile_id: userId, status: "won", updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) throw new Error("La conversion a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: userId,
    type: "milestone",
    title: "Bienvenue chez KOV",
    adminTitle: `${actorName} a converti le lead ${lead.name} en client`,
    actorId: admin.id,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/clients");
}

export async function createLead(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const company = formData.get("company");
  const projectType = formData.get("project_type");
  const timeline = formData.get("timeline");
  const budget = formData.get("budget_eur");
  const message = formData.get("message");

  if (typeof name !== "string" || !name.trim()) throw new Error("Nom requis.");
  if (typeof email !== "string" || !email.trim()) throw new Error("Email requis.");

  const budgetCents =
    typeof budget === "string" && budget.trim()
      ? Math.round(parseFloat(budget.replace(",", ".")) * 100)
      : null;

  const { error } = await supabaseAdmin.from("leads").insert({
    name: name.trim(),
    email: email.trim(),
    phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
    company: typeof company === "string" && company.trim() ? company.trim() : null,
    project_type: typeof projectType === "string" && projectType.trim() ? projectType.trim() : null,
    timeline: typeof timeline === "string" && timeline.trim() ? timeline.trim() : null,
    budget_cents: Number.isFinite(budgetCents) ? budgetCents : null,
    message: typeof message === "string" && message.trim() ? message.trim() : null,
    source: "admin-manuel",
    status: "new",
  });

  if (error) throw new Error("La création du lead a échoué.");

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
}
