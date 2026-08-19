"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isTaskStatus, isPriority } from "@/lib/admin/status";

export async function createTask(formData: FormData) {
  await requireAdmin();

  const projectId = formData.get("project_id");
  const title = formData.get("title");
  const description = formData.get("description");
  const assignedTo = formData.get("assigned_to");
  const priority = formData.get("priority");
  const dueDate = formData.get("due_date");

  if (typeof projectId !== "string" || !projectId) throw new Error("Projet requis.");
  if (typeof title !== "string" || !title.trim()) throw new Error("Titre requis.");

  const priorityValue = typeof priority === "string" && isPriority(priority) ? priority : null;

  const { error } = await supabaseAdmin.from("project_tasks").insert({
    project_id: projectId,
    title: title.trim(),
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    assigned_to: typeof assignedTo === "string" && assignedTo ? assignedTo : null,
    priority: priorityValue,
    due_date: typeof dueDate === "string" && dueDate ? dueDate : null,
  });

  if (error) throw new Error("La création de la tâche a échoué.");

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

export async function updateTaskStatus(taskId: string, status: string) {
  await requireAdmin();

  if (!isTaskStatus(status)) throw new Error("Statut invalide.");

  const { error } = await supabaseAdmin
    .from("project_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error("La mise à jour a échoué.");

  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}
