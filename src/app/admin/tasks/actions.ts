"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadClientFile, deleteClientFile, createSignedDownloadUrl } from "@/lib/portal/storage";
import { logActivity, getActorDisplayName } from "@/lib/activity";
import { isTaskStatus, isPriority, isValidationStatus } from "@/lib/admin/status";

function revalidateTaskPaths(projectId: string) {
  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${projectId}`);
}

async function getTaskWithProject(taskId: string) {
  const { data: task } = await supabaseAdmin
    .from("project_tasks")
    .select("id, title, status, project_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) throw new Error("Tâche introuvable.");

  const { data: project } = await supabaseAdmin.from("projects").select("client_id, name").eq("id", task.project_id).maybeSingle();
  if (!project) throw new Error("Projet introuvable.");

  return { task, project };
}

// Kanban drag-and-drop: sets status + column-relative position together, and
// only logs activity when the status actually changed (a pure in-column
// reorder shouldn't spam the feed).
export async function moveTask(taskId: string, status: string, position: number) {
  const admin = await requireAdmin();
  if (!isTaskStatus(status)) throw new Error("Statut invalide.");

  const { task, project } = await getTaskWithProject(taskId);

  const { error } = await supabaseAdmin
    .from("project_tasks")
    .update({ status, position, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw new Error("Le déplacement a échoué.");

  if (task.status !== status) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: project.client_id,
      projectId: task.project_id,
      type: "task",
      title: `Tâche mise à jour : ${task.title}`,
      adminTitle: `${actorName} a déplacé « ${task.title} » vers ${status}`,
      actorId: admin.id,
    });
  }

  revalidateTaskPaths(task.project_id);
}

export type TaskFieldsPatch = {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  assignedTo?: string | null;
  phaseId?: string | null;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  validationStatus?: string;
};

// Single flexible update path for the task detail panel — every field the
// panel can edit inline goes through here so there's one place that logs
// activity and revalidates, instead of one action per field.
export async function updateTaskFields(taskId: string, patch: TaskFieldsPatch) {
  const admin = await requireAdmin();
  const { task, project } = await getTaskWithProject(taskId);

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new Error("Titre requis.");
    update.title = patch.title.trim();
  }
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.status !== undefined) {
    if (!isTaskStatus(patch.status)) throw new Error("Statut invalide.");
    update.status = patch.status;
  }
  if (patch.priority !== undefined) {
    if (patch.priority !== null && !isPriority(patch.priority)) throw new Error("Priorité invalide.");
    update.priority = patch.priority;
  }
  if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo;
  if (patch.phaseId !== undefined) update.phase_id = patch.phaseId;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
  if (patch.estimatedMinutes !== undefined) update.estimated_minutes = patch.estimatedMinutes;
  if (patch.validationStatus !== undefined) {
    if (!isValidationStatus(patch.validationStatus)) throw new Error("Statut de validation invalide.");
    update.validation_status = patch.validationStatus;
  }

  const { error } = await supabaseAdmin.from("project_tasks").update(update).eq("id", taskId);
  if (error) throw new Error("La mise à jour a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: project.client_id,
    projectId: task.project_id,
    type: "task",
    title: `Tâche mise à jour : ${task.title}`,
    adminTitle: `${actorName} a modifié « ${task.title} »`,
    actorId: admin.id,
  });

  revalidateTaskPaths(task.project_id);
}

export async function deleteTask(taskId: string) {
  const admin = await requireAdmin();
  const { task, project } = await getTaskWithProject(taskId);

  const { error } = await supabaseAdmin.from("project_tasks").delete().eq("id", taskId);
  if (error) throw new Error("La suppression a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: project.client_id,
    projectId: task.project_id,
    type: "task",
    title: `Tâche supprimée : ${task.title}`,
    adminTitle: `${actorName} a supprimé « ${task.title} »`,
    actorId: admin.id,
  });

  revalidateTaskPaths(task.project_id);
}

export type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  assignedTo: string | null;
  phaseId: string | null;
  dueDate: string | null;
  estimatedMinutes: number | null;
  validationStatus: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  checklist: { id: string; label: string; isDone: boolean; position: number }[];
  comments: { id: string; body: string; authorId: string; authorName: string; createdAt: string; editedAt: string | null }[];
  timeEntries: {
    id: string;
    userId: string;
    userName: string;
    startedAt: string;
    endedAt: string | null;
    minutes: number | null;
    note: string | null;
  }[];
  attachments: { id: string; filename: string; mimeType: string | null; sizeBytes: number; createdAt: string }[];
  phases: { id: string; name: string }[];
  admins: { id: string; label: string }[];
  runningTimerId: string | null;
};

// One aggregated read for the whole detail panel — matches the
// getDocumentPreviewUrl/getQuotePdfUrl convention (a "use server" function
// that returns data, called directly from a client component) rather than
// a route handler.
export async function getTaskDetail(taskId: string): Promise<TaskDetail> {
  const admin = await requireAdmin();

  const { data: task } = await supabaseAdmin
    .from("project_tasks")
    .select(
      "id, title, description, status, priority, assigned_to, phase_id, due_date, estimated_minutes, validation_status, project_id, created_at"
    )
    .eq("id", taskId)
    .maybeSingle();
  if (!task) throw new Error("Tâche introuvable.");

  const [{ data: project }, { data: checklist }, { data: comments }, { data: timeEntries }, { data: attachments }, { data: phases }, { data: admins }] =
    await Promise.all([
      supabaseAdmin.from("projects").select("name").eq("id", task.project_id).maybeSingle(),
      supabaseAdmin.from("task_checklist_items").select("id, label, is_done, position").eq("task_id", taskId).order("position"),
      supabaseAdmin.from("task_comments").select("id, body, author_id, created_at, edited_at").eq("task_id", taskId).order("created_at"),
      supabaseAdmin
        .from("task_time_entries")
        .select("id, user_id, started_at, ended_at, minutes, note")
        .eq("task_id", taskId)
        .order("started_at", { ascending: false }),
      supabaseAdmin
        .from("documents")
        .select("id, filename, mime_type, size_bytes, created_at")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("project_phases").select("id, name").eq("project_id", task.project_id).order("position"),
      supabaseAdmin.from("profiles").select("id, full_name, email").eq("role", "admin").is("archived_at", null).order("full_name"),
    ]);

  const adminNameById = new Map((admins ?? []).map((a) => [a.id, a.full_name || a.email]));
  const timeEntryRows = timeEntries ?? [];

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignedTo: task.assigned_to,
    phaseId: task.phase_id,
    dueDate: task.due_date,
    estimatedMinutes: task.estimated_minutes,
    validationStatus: task.validation_status,
    projectId: task.project_id,
    projectName: project?.name ?? "—",
    createdAt: task.created_at,
    checklist: (checklist ?? []).map((c) => ({ id: c.id, label: c.label, isDone: c.is_done, position: c.position })),
    comments: (comments ?? []).map((c) => ({
      id: c.id,
      body: c.body,
      authorId: c.author_id,
      authorName: adminNameById.get(c.author_id) ?? "Équipe KOV",
      createdAt: c.created_at,
      editedAt: c.edited_at,
    })),
    timeEntries: timeEntryRows.map((t) => ({
      id: t.id,
      userId: t.user_id,
      userName: adminNameById.get(t.user_id) ?? "Équipe KOV",
      startedAt: t.started_at,
      endedAt: t.ended_at,
      minutes: t.minutes,
      note: t.note,
    })),
    attachments: (attachments ?? []).map((d) => ({
      id: d.id,
      filename: d.filename,
      mimeType: d.mime_type,
      sizeBytes: d.size_bytes,
      createdAt: d.created_at,
    })),
    phases: (phases ?? []).map((p) => ({ id: p.id, name: p.name })),
    admins: (admins ?? []).map((a) => ({ id: a.id, label: a.full_name || a.email })),
    runningTimerId: timeEntryRows.find((t) => t.user_id === admin.id && !t.ended_at)?.id ?? null,
  };
}

export async function addChecklistItem(taskId: string, label: string) {
  await requireAdmin();
  if (!label.trim()) throw new Error("Libellé requis.");

  const { count } = await supabaseAdmin.from("task_checklist_items").select("id", { count: "exact", head: true }).eq("task_id", taskId);
  const { error } = await supabaseAdmin.from("task_checklist_items").insert({ task_id: taskId, label: label.trim(), position: count ?? 0 });
  if (error) throw new Error("L'ajout a échoué.");

  revalidatePath("/admin/tasks");
}

export async function toggleChecklistItem(itemId: string, isDone: boolean) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("task_checklist_items").update({ is_done: isDone }).eq("id", itemId);
  if (error) throw new Error("La mise à jour a échoué.");
  revalidatePath("/admin/tasks");
}

export async function deleteChecklistItem(itemId: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("task_checklist_items").delete().eq("id", itemId);
  if (error) throw new Error("La suppression a échoué.");
  revalidatePath("/admin/tasks");
}

export async function addComment(taskId: string, body: string) {
  const admin = await requireAdmin();
  if (!body.trim()) throw new Error("Commentaire vide.");

  const { error } = await supabaseAdmin.from("task_comments").insert({ task_id: taskId, author_id: admin.id, body: body.trim() });
  if (error) throw new Error("L'ajout a échoué.");

  revalidatePath("/admin/tasks");
}

export async function deleteComment(commentId: string) {
  const admin = await requireAdmin();

  const { data: comment } = await supabaseAdmin.from("task_comments").select("author_id").eq("id", commentId).maybeSingle();
  if (!comment) throw new Error("Commentaire introuvable.");
  if (comment.author_id !== admin.id) throw new Error("Vous ne pouvez supprimer que vos propres commentaires.");

  const { error } = await supabaseAdmin.from("task_comments").delete().eq("id", commentId);
  if (error) throw new Error("La suppression a échoué.");

  revalidatePath("/admin/tasks");
}

// One running timer per user at a time — starting a new one auto-stops any
// other still-running entry for that user, enforced here rather than in the
// DB (see the table's own migration comment).
export async function startTimer(taskId: string) {
  const admin = await requireAdmin();

  const { data: running } = await supabaseAdmin
    .from("task_time_entries")
    .select("id, started_at")
    .eq("user_id", admin.id)
    .is("ended_at", null);

  for (const entry of running ?? []) {
    const minutes = Math.max(1, Math.round((Date.now() - new Date(entry.started_at).getTime()) / 60000));
    await supabaseAdmin.from("task_time_entries").update({ ended_at: new Date().toISOString(), minutes }).eq("id", entry.id);
  }

  const { error } = await supabaseAdmin
    .from("task_time_entries")
    .insert({ task_id: taskId, user_id: admin.id, started_at: new Date().toISOString() });
  if (error) throw new Error("Le démarrage du minuteur a échoué.");

  revalidatePath("/admin/tasks");
}

export async function stopTimer(entryId: string) {
  const admin = await requireAdmin();

  const { data: entry } = await supabaseAdmin.from("task_time_entries").select("started_at, user_id").eq("id", entryId).maybeSingle();
  if (!entry) throw new Error("Entrée introuvable.");
  if (entry.user_id !== admin.id) throw new Error("Ce minuteur appartient à quelqu'un d'autre.");

  const minutes = Math.max(1, Math.round((Date.now() - new Date(entry.started_at).getTime()) / 60000));
  const { error } = await supabaseAdmin.from("task_time_entries").update({ ended_at: new Date().toISOString(), minutes }).eq("id", entryId);
  if (error) throw new Error("L'arrêt du minuteur a échoué.");

  revalidatePath("/admin/tasks");
}

export async function addManualTimeEntry(taskId: string, minutes: number, note: string | null) {
  const admin = await requireAdmin();
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error("Durée invalide.");

  const now = new Date();
  const started = new Date(now.getTime() - minutes * 60000);
  const { error } = await supabaseAdmin.from("task_time_entries").insert({
    task_id: taskId,
    user_id: admin.id,
    started_at: started.toISOString(),
    ended_at: now.toISOString(),
    minutes: Math.round(minutes),
    note,
  });
  if (error) throw new Error("L'ajout a échoué.");

  revalidatePath("/admin/tasks");
}

export async function deleteTimeEntry(entryId: string) {
  const admin = await requireAdmin();

  const { data: entry } = await supabaseAdmin.from("task_time_entries").select("user_id").eq("id", entryId).maybeSingle();
  if (!entry) throw new Error("Entrée introuvable.");
  if (entry.user_id !== admin.id) throw new Error("Cette entrée appartient à quelqu'un d'autre.");

  const { error } = await supabaseAdmin.from("task_time_entries").delete().eq("id", entryId);
  if (error) throw new Error("La suppression a échoué.");

  revalidatePath("/admin/tasks");
}

export async function uploadTaskAttachment(formData: FormData) {
  const admin = await requireAdmin();

  const taskId = formData.get("task_id");
  const file = formData.get("file");
  if (typeof taskId !== "string" || !taskId) throw new Error("Tâche invalide.");
  if (!(file instanceof File) || file.size === 0) throw new Error("Fichier invalide.");

  const { task, project } = await getTaskWithProject(taskId);

  const documentId = crypto.randomUUID();
  const storagePath = `${project.client_id}/documents/${documentId}-${file.name}`;
  await uploadClientFile(storagePath, file);

  const { error } = await supabaseAdmin.from("documents").insert({
    id: documentId,
    client_id: project.client_id,
    project_id: task.project_id,
    task_id: taskId,
    visibility: "internal",
    filename: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: admin.id,
  });
  if (error) throw new Error("L'enregistrement du fichier a échoué.");

  revalidatePath("/admin/tasks");
}

export async function deleteTaskAttachment(documentId: string) {
  await requireAdmin();

  const { data: doc } = await supabaseAdmin.from("documents").select("storage_path").eq("id", documentId).maybeSingle();
  if (!doc) throw new Error("Fichier introuvable.");

  const { error } = await supabaseAdmin.from("documents").delete().eq("id", documentId);
  if (error) throw new Error("La suppression a échoué.");

  await deleteClientFile(doc.storage_path);
  revalidatePath("/admin/tasks");
}

export async function getTaskAttachmentUrl(documentId: string): Promise<string> {
  await requireAdmin();

  const { data: doc } = await supabaseAdmin.from("documents").select("storage_path, filename").eq("id", documentId).maybeSingle();
  if (!doc) throw new Error("Fichier introuvable.");

  const url = await createSignedDownloadUrl(doc.storage_path, 300, doc.filename);
  if (!url) throw new Error("Téléchargement indisponible.");

  return url;
}
