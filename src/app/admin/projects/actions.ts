"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isTaskStatus, isPriority } from "@/lib/admin/status";
import { logActivity, getActorDisplayName } from "@/lib/activity";

export async function createTask(formData: FormData) {
  const admin = await requireAdmin();

  const projectId = formData.get("project_id");
  const title = formData.get("title");
  const description = formData.get("description");
  const assignedTo = formData.get("assigned_to");
  const priority = formData.get("priority");
  const dueDate = formData.get("due_date");
  const phaseId = formData.get("phase_id");

  if (typeof projectId !== "string" || !projectId) throw new Error("Projet requis.");
  if (typeof title !== "string" || !title.trim()) throw new Error("Titre requis.");

  const priorityValue = typeof priority === "string" && isPriority(priority) ? priority : null;

  const { data: project } = await supabaseAdmin.from("projects").select("client_id, name").eq("id", projectId).maybeSingle();
  if (!project) throw new Error("Projet introuvable.");

  const { error } = await supabaseAdmin.from("project_tasks").insert({
    project_id: projectId,
    title: title.trim(),
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    assigned_to: typeof assignedTo === "string" && assignedTo ? assignedTo : null,
    priority: priorityValue,
    due_date: typeof dueDate === "string" && dueDate ? dueDate : null,
    phase_id: typeof phaseId === "string" && phaseId ? phaseId : null,
    created_by: admin.id,
  });

  if (error) throw new Error("La création de la tâche a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: project.client_id,
    projectId,
    type: "task",
    title: `Nouvelle tâche : ${title.trim()}`,
    adminTitle: `${actorName} a créé la tâche « ${title.trim()} » sur ${project.name}`,
    actorId: admin.id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/tasks");
}

export async function updateTaskStatus(taskId: string, status: string) {
  const admin = await requireAdmin();

  if (!isTaskStatus(status)) throw new Error("Statut invalide.");

  const { data: existing } = await supabaseAdmin
    .from("project_tasks")
    .select("title, project_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!existing) throw new Error("Tâche introuvable.");

  const { error } = await supabaseAdmin
    .from("project_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error("La mise à jour a échoué.");

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("client_id, name")
    .eq("id", existing.project_id)
    .maybeSingle();
  if (project) {
    const actorName = await getActorDisplayName(admin.id);
    await logActivity({
      clientId: project.client_id,
      projectId: existing.project_id,
      type: "task",
      title: `Tâche mise à jour : ${existing.title}`,
      adminTitle: `${actorName} a changé le statut de « ${existing.title} » sur ${project.name}`,
      actorId: admin.id,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}
