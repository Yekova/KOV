"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isProjectStatus, isInvoiceStatus, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/portal/status";
import { uploadClientFile } from "@/lib/portal/storage";
import { logActivity, getActorDisplayName } from "@/lib/activity";
import { isPipelineStage, isPriority } from "@/lib/admin/status";

function revalidateClient(clientId: string) {
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/client");
  revalidatePath("/client/projects");
  revalidatePath("/client/documents");
  revalidatePath("/client/invoices");
  revalidatePath("/client/requests");
}

export async function setAccountManager(clientId: string, formData: FormData) {
  await requireAdmin();

  const adminId = formData.get("account_manager_id");
  const value = typeof adminId === "string" && adminId ? adminId : null;

  const { error } = await supabaseAdmin.from("profiles").update({ account_manager_id: value }).eq("id", clientId);
  if (error) throw new Error("L'attribution a échoué.");

  revalidateClient(clientId);
}

function parseEuroToCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const cents = Math.round(parseFloat(value.replace(",", ".")) * 100);
  return Number.isFinite(cents) && cents >= 0 ? cents : null;
}

export async function createProject(formData: FormData) {
  const admin = await requireAdmin();

  const clientId = formData.get("client_id");
  const name = formData.get("name");
  const category = formData.get("category");
  const status = formData.get("status");
  const pipelineStage = formData.get("pipeline_stage");
  const progress = formData.get("progress_percent");
  const deadline = formData.get("next_deadline_date");
  const phaseLabel = formData.get("deadline_phase_label");
  const projectManagerId = formData.get("project_manager_id");
  const budget = formData.get("budget_eur");
  const priority = formData.get("priority");
  const description = formData.get("description");

  if (typeof clientId !== "string" || !clientId) throw new Error("Client invalide.");
  if (typeof name !== "string" || !name.trim()) throw new Error("Nom de projet requis.");
  if (typeof category !== "string" || !category.trim()) throw new Error("Catégorie requise.");

  const statusValue = typeof status === "string" && isProjectStatus(status) ? status : "in_progress";
  const pipelineStageValue = typeof pipelineStage === "string" && isPipelineStage(pipelineStage) ? pipelineStage : "discovery";
  const progressValue =
    typeof progress === "string" && progress ? Math.min(100, Math.max(0, parseInt(progress, 10) || 0)) : 0;
  const priorityValue = typeof priority === "string" && isPriority(priority) ? priority : null;

  const { data, error } = await supabaseAdmin
    .from("projects")
    .insert({
      client_id: clientId,
      name: name.trim(),
      category: category.trim(),
      status: statusValue,
      pipeline_stage: pipelineStageValue,
      progress_percent: progressValue,
      next_deadline_date: typeof deadline === "string" && deadline ? deadline : null,
      deadline_phase_label: typeof phaseLabel === "string" && phaseLabel.trim() ? phaseLabel.trim() : null,
      project_manager_id: typeof projectManagerId === "string" && projectManagerId ? projectManagerId : null,
      budget_cents: parseEuroToCents(budget),
      priority: priorityValue,
      description: typeof description === "string" && description.trim() ? description.trim() : null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("La création du projet a échoué.");

  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId,
    projectId: data.id,
    type: "milestone",
    title: "Nouveau projet créé",
    adminTitle: `${actorName} a créé le projet ${name.trim()}`,
    actorId: admin.id,
    description: name.trim(),
  });

  revalidateClient(clientId);
}

export async function updateProject(projectId: string, formData: FormData) {
  const admin = await requireAdmin();

  const { data: existing } = await supabaseAdmin
    .from("projects")
    .select("client_id, name, status, progress_percent")
    .eq("id", projectId)
    .maybeSingle();

  if (!existing) throw new Error("Projet introuvable.");

  const status = formData.get("status");
  const pipelineStage = formData.get("pipeline_stage");
  const progress = formData.get("progress_percent");
  const deadline = formData.get("next_deadline_date");
  const phaseLabel = formData.get("deadline_phase_label");
  const projectManagerId = formData.get("project_manager_id");
  const budget = formData.get("budget_eur");
  const priority = formData.get("priority");

  const statusValue: ProjectStatus =
    typeof status === "string" && isProjectStatus(status) ? status : (existing.status as ProjectStatus);
  const progressValue =
    typeof progress === "string" && progress
      ? Math.min(100, Math.max(0, parseInt(progress, 10) || 0))
      : existing.progress_percent;

  const { error } = await supabaseAdmin
    .from("projects")
    .update({
      status: statusValue,
      pipeline_stage: typeof pipelineStage === "string" && isPipelineStage(pipelineStage) ? pipelineStage : undefined,
      progress_percent: progressValue,
      next_deadline_date: typeof deadline === "string" ? deadline || null : undefined,
      deadline_phase_label: typeof phaseLabel === "string" ? phaseLabel.trim() || null : undefined,
      project_manager_id:
        typeof projectManagerId === "string" ? (projectManagerId || null) : undefined,
      budget_cents: budget !== null ? parseEuroToCents(budget) : undefined,
      priority: typeof priority === "string" ? (isPriority(priority) ? priority : null) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) throw new Error("La mise à jour a échoué.");

  if (statusValue !== existing.status || progressValue !== existing.progress_percent) {
    const actorName = await getActorDisplayName(admin.id);
    const changedStatus = statusValue !== existing.status;

    await logActivity({
      clientId: existing.client_id,
      projectId,
      type: "milestone",
      title: changedStatus ? "Statut de projet mis à jour" : "Avancement mis à jour",
      adminTitle: changedStatus
        ? `${actorName} a mis à jour le statut du projet ${existing.name}`
        : `${actorName} a mis à jour l'avancement du projet ${existing.name}`,
      actorId: admin.id,
      description: `${PROJECT_STATUS_LABELS[statusValue]} — ${progressValue}%`,
    });
  }

  revalidateClient(existing.client_id);
}

// Persists a pipeline drag-and-drop move — called from the dashboard's
// kanban board, distinct from updateProject's fuller form-based update.
export async function updateProjectPipelineStage(projectId: string, stage: string) {
  const admin = await requireAdmin();

  if (!isPipelineStage(stage)) throw new Error("Étape invalide.");

  const { data: existing } = await supabaseAdmin
    .from("projects")
    .select("client_id, name, pipeline_stage")
    .eq("id", projectId)
    .maybeSingle();
  if (!existing) throw new Error("Projet introuvable.");

  const { error } = await supabaseAdmin.from("projects").update({ pipeline_stage: stage }).eq("id", projectId);
  if (error) throw new Error("La mise à jour a échoué.");

  if (existing.pipeline_stage !== stage) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: existing.client_id,
      projectId,
      type: "milestone",
      title: "Étape du projet mise à jour",
      adminTitle: `${actorName} a déplacé le projet ${existing.name} dans le pipeline`,
      actorId: admin.id,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

export async function uploadDocument(formData: FormData) {
  const admin = await requireAdmin();

  const clientId = formData.get("client_id");
  const projectId = formData.get("project_id");
  const file = formData.get("file");

  if (typeof clientId !== "string" || !clientId) throw new Error("Client invalide.");
  if (!(file instanceof File) || file.size === 0) throw new Error("Fichier invalide.");

  const documentId = crypto.randomUUID();
  const storagePath = `${clientId}/documents/${documentId}-${file.name}`;
  await uploadClientFile(storagePath, file);

  const projectIdValue = typeof projectId === "string" && projectId ? projectId : null;

  const { error } = await supabaseAdmin.from("documents").insert({
    id: documentId,
    client_id: clientId,
    project_id: projectIdValue,
    filename: file.name,
    storage_path: storagePath,
    uploaded_by: admin.id,
  });

  if (error) throw new Error("L'enregistrement du document a échoué.");

  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId,
    projectId: projectIdValue,
    type: "document",
    title: "Document ajouté",
    adminTitle: `${actorName} a ajouté un nouveau fichier sur ${file.name}`,
    actorId: admin.id,
    description: file.name,
  });

  revalidateClient(clientId);
}

export async function createInvoice(formData: FormData) {
  const admin = await requireAdmin();

  const clientId = formData.get("client_id");
  const projectId = formData.get("project_id");
  const reference = formData.get("reference");
  const amount = formData.get("amount_eur");
  const dueAt = formData.get("due_at");
  const pdfFile = formData.get("pdf_file");

  if (typeof clientId !== "string" || !clientId) throw new Error("Client invalide.");
  if (typeof reference !== "string" || !reference.trim()) throw new Error("Référence requise.");

  const amountCents = parseEuroToCents(amount);
  if (amountCents === null) throw new Error("Montant invalide.");

  const invoiceId = crypto.randomUUID();
  let pdfPath: string | null = null;
  if (pdfFile instanceof File && pdfFile.size > 0) {
    pdfPath = `${clientId}/invoices/${invoiceId}.pdf`;
    await uploadClientFile(pdfPath, pdfFile);
  }

  const projectIdValue = typeof projectId === "string" && projectId ? projectId : null;

  const { error } = await supabaseAdmin.from("invoices").insert({
    id: invoiceId,
    client_id: clientId,
    project_id: projectIdValue,
    reference: reference.trim(),
    amount_cents: amountCents,
    status: "sent",
    pdf_storage_path: pdfPath,
    due_at: typeof dueAt === "string" && dueAt ? new Date(dueAt).toISOString() : null,
  });

  if (error) throw new Error("La création de la facture a échoué.");

  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId,
    projectId: projectIdValue,
    type: "invoice",
    title: "Facture émise",
    adminTitle: `${actorName} a émis la facture ${reference.trim()}`,
    actorId: admin.id,
    description: `Facture ${reference.trim()}`,
  });

  revalidateClient(clientId);
}

export async function updateInvoiceStatus(invoiceId: string, formData: FormData) {
  const admin = await requireAdmin();

  const status = formData.get("status");
  if (typeof status !== "string" || !isInvoiceStatus(status)) throw new Error("Statut invalide.");

  const { data: existing } = await supabaseAdmin
    .from("invoices")
    .select("client_id, project_id, reference, status")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!existing) throw new Error("Facture introuvable.");

  // Only stamp/clear paid_at on the actual transition — setting now() on
  // every resubmit of an already-paid invoice would clobber the real
  // payment date.
  const becamePaid = existing.status !== "paid" && status === "paid";
  const leftPaid = existing.status === "paid" && status !== "paid";

  const { error } = await supabaseAdmin
    .from("invoices")
    .update({
      status,
      paid_at: becamePaid ? new Date().toISOString() : leftPaid ? null : undefined,
    })
    .eq("id", invoiceId);
  if (error) throw new Error("La mise à jour a échoué.");

  if (becamePaid) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: existing.client_id,
      projectId: existing.project_id,
      type: "invoice",
      title: "Facture payée",
      adminTitle: `${actorName} a marqué la facture ${existing.reference} comme payée`,
      actorId: admin.id,
      description: `Facture ${existing.reference}`,
    });
  }

  revalidateClient(existing.client_id);
}

export async function replyToRequestThread(threadId: string, formData: FormData) {
  const admin = await requireAdmin();

  const body = formData.get("body");
  if (typeof body !== "string" || !body.trim()) throw new Error("Message vide.");

  const { data: thread } = await supabaseAdmin
    .from("request_threads")
    .select("client_id, project_id, subject")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) throw new Error("Demande introuvable.");

  const { error } = await supabaseAdmin.from("request_messages").insert({
    thread_id: threadId,
    client_id: thread.client_id,
    body: body.trim(),
    created_by: "admin",
    author_admin_id: admin.id,
  });
  if (error) throw new Error("L'envoi a échoué.");

  await supabaseAdmin
    .from("request_threads")
    .update({ status: "answered", updated_at: new Date().toISOString() })
    .eq("id", threadId);

  const actorName = await getActorDisplayName(admin.id);

  await logActivity({
    clientId: thread.client_id,
    projectId: thread.project_id,
    type: "message",
    title: `Message de ${actorName}`,
    adminTitle: `${actorName} a répondu à la demande « ${thread.subject} »`,
    actorId: admin.id,
    description: body.trim().slice(0, 140),
  });

  revalidateClient(thread.client_id);
}
