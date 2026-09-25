"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isLeadSource } from "@/lib/admin/status";
import { provisionClient } from "@/lib/clients/provision";
import { logActivity, getActorDisplayName } from "@/lib/activity";
import { logLeadInteraction } from "@/lib/leads/interactions";
import { recomputeLeadScore } from "@/lib/leads/recomputeScore";

// Note: leads have no client_id (they're pre-signature prospects, not
// linked to a profiles row), so lead events are never written to
// activity_log — that table's client_id is NOT NULL. Their own timeline
// lives in lead_interactions instead (see logLeadInteraction).

export async function updateLeadStatus(leadId: string, status: string) {
  const admin = await requireAdmin();

  const { data: statusRow } = await supabaseAdmin.from("lead_statuses").select("key").eq("key", status).maybeSingle();
  if (!statusRow) throw new Error("Statut invalide.");

  const { data: existing } = await supabaseAdmin.from("leads").select("status").eq("id", leadId).maybeSingle();
  if (!existing) throw new Error("Lead introuvable.");
  if (existing.status === status) return;

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    throw new Error("La mise à jour du statut a échoué.");
  }

  await logLeadInteraction({
    leadId,
    type: "status_change",
    actorId: admin.id,
    metadata: { from_status: existing.status, to_status: status },
  });
  await recomputeLeadScore(leadId);

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function updateLeadSource(leadId: string, source: string) {
  await requireAdmin();

  if (!isLeadSource(source)) throw new Error("Source invalide.");

  const { error } = await supabaseAdmin.from("leads").update({ source, updated_at: new Date().toISOString() }).eq("id", leadId);
  if (error) throw new Error("La mise à jour a échoué.");

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

// Bulk equivalents for the list's multi-select action bar — same
// validation as the single-lead versions, applied to every id at once.
export async function bulkUpdateLeadStatus(leadIds: string[], status: string): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  if (leadIds.length === 0) return { error: null };

  const { data: statusRow } = await supabaseAdmin.from("lead_statuses").select("key").eq("key", status).maybeSingle();
  if (!statusRow) return { error: "Statut invalide." };

  const { data: existingLeads } = await supabaseAdmin.from("leads").select("id, status").in("id", leadIds);

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", leadIds);
  if (error) return { error: "La mise à jour groupée a échoué." };

  const changedLeads = (existingLeads ?? []).filter((l) => l.status !== status);
  await Promise.all(
    changedLeads.map((l) =>
      logLeadInteraction({
        leadId: l.id,
        type: "status_change",
        actorId: admin.id,
        metadata: { from_status: l.status, to_status: status },
      })
    )
  );
  await Promise.all(changedLeads.map((l) => recomputeLeadScore(l.id)));

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  return { error: null };
}

export async function bulkAssignLead(leadIds: string[], assignedTo: string | null): Promise<{ error: string | null }> {
  await requireAdmin();
  if (leadIds.length === 0) return { error: null };

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .in("id", leadIds);
  if (error) return { error: "L'attribution groupée a échoué." };

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  return { error: null };
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

/** Convertit un lead en client, en emportant la relation.
 *
 *  Décision d'architecture : **la ligne du lead reste l'archive.** On ne
 *  copie que ce dont la fiche client devient la source vivante — téléphone
 *  et responsable de compte. Le brief, le budget, le type de projet, les
 *  notes, les tags, le score et la trace de consentement restent sur le
 *  lead et se lisent à travers leads.converted_profile_id.
 *
 *  Copier ces champs créerait un doublon que personne ne met à jour et qui
 *  diverge en un mois. Pour le consentement ce serait pire : une
 *  affirmation juridique sans évènement derrière.
 *
 *  L'historique des échanges n'est pas migré non plus. activity_log a une
 *  policy de lecture `auth.uid() = client_id` et un titre visible par le
 *  client : les notes commerciales internes n'ont rien à faire derrière
 *  cette porte.
 */
export async function convertLeadToClient(leadId: string) {
  const admin = await requireAdmin();

  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("name, email, company, phone, assigned_to, status, converted_profile_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) throw new Error("Lead introuvable.");
  if (lead.converted_profile_id) throw new Error("Ce lead a déjà été converti en client.");

  const { userId } = await provisionClient({
    email: lead.email,
    fullName: lead.name,
    company: lead.company,
    phone: lead.phone,
    // Si le lead n'a pas de responsable, on n'en choisit pas un : désigner
    // par défaut le seul administrateur reviendrait à l'inventer.
    accountManagerId: lead.assigned_to,
  });

  await linkLeadQuotesToClient(leadId, userId);

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
  await logLeadInteraction({
    leadId,
    type: "status_change",
    actorId: admin.id,
    content: "Converti en client",
    metadata: { from_status: lead.status, to_status: "won" },
  });
  await recomputeLeadScore(leadId);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/clients");

  return { clientId: userId };
}

/** Rattache au client les devis émis pendant qu'il n'était encore qu'un lead.
 *
 *  Sans ça, `convertQuoteToInvoice` échouait net : elle exige un client_id.
 *  L'admin devait passer par le menu « Rattacher à un client » de chaque
 *  devis, alors que la réponse était déjà en base.
 *
 *  Ne touche que les devis sans client : on remplit un vide, on ne déplace
 *  rien. lead_id est conservé, c'est l'origine du devis. */
async function linkLeadQuotesToClient(leadId: string, clientId: string) {
  await supabaseAdmin
    .from("quotes")
    .update({ client_id: clientId, updated_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .is("client_id", null);
}

/** Rattache un lead à un client qui existe déjà.
 *
 *  Le cas normal du client de retour : il re-remplit le formulaire de
 *  contact, ce qui crée un second lead. Celui-là ne doit pas produire un
 *  second compte — d'où l'absence d'invitation ici, et l'absence de
 *  contrainte d'unicité sur converted_profile_id. */
export async function attachLeadToClient(leadId: string, clientId: string): Promise<{ error: string | null }> {
  const admin = await requireAdmin();

  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("name, status, converted_profile_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { error: "Lead introuvable." };
  if (lead.converted_profile_id) return { error: "Ce lead est déjà rattaché à un client." };

  const { data: client } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", clientId)
    .eq("role", "client")
    .maybeSingle();
  if (!client) return { error: "Client introuvable." };

  await linkLeadQuotesToClient(leadId, clientId);

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ converted_profile_id: clientId, status: "won", updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) return { error: "Le rattachement a échoué." };

  await logLeadInteraction({
    leadId,
    type: "status_change",
    actorId: admin.id,
    content: "Rattaché à un client existant",
    metadata: { from_status: lead.status, to_status: "won", client_id: clientId },
  });
  await recomputeLeadScore(leadId);

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/clients");
  return { error: null };
}

// Returns { error } instead of throwing for expected/validation failures —
// see convertQuoteToInvoice's comment (src/app/admin/quotes/actions.ts) for
// why: Next.js 16 redacts thrown Server Action error messages in production.
export async function createLead(formData: FormData): Promise<{ error: string | null }> {
  const admin = await requireAdmin();

  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const company = formData.get("company");
  const projectType = formData.get("project_type");
  const timeline = formData.get("timeline");
  const budget = formData.get("budget_eur");
  const message = formData.get("message");
  const source = formData.get("source");

  if (typeof name !== "string" || !name.trim()) return { error: "Nom requis." };
  if (typeof email !== "string" || !email.trim()) return { error: "Email requis." };

  const budgetCents =
    typeof budget === "string" && budget.trim()
      ? Math.round(parseFloat(budget.replace(",", ".")) * 100)
      : null;

  const resolvedSource = typeof source === "string" && isLeadSource(source) ? source : "autre";

  const { data: created, error } = await supabaseAdmin
    .from("leads")
    .insert({
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      company: typeof company === "string" && company.trim() ? company.trim() : null,
      project_type: typeof projectType === "string" && projectType.trim() ? projectType.trim() : null,
      timeline: typeof timeline === "string" && timeline.trim() ? timeline.trim() : null,
      budget_cents: Number.isFinite(budgetCents) ? budgetCents : null,
      message: typeof message === "string" && message.trim() ? message.trim() : null,
      source: resolvedSource,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !created) return { error: "La création du lead a échoué." };

  await logLeadInteraction({ leadId: created.id, type: "form", actorId: admin.id, metadata: { source: resolvedSource } });
  await recomputeLeadScore(created.id);

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  return { error: null };
}
