"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadClientFile, createSignedDownloadUrl, deleteClientFile } from "@/lib/portal/storage";
import { logActivity, getActorDisplayName } from "@/lib/activity";
import { isProjectPhaseStatus } from "@/lib/admin/status";

export async function createDocumentFolder(formData: FormData) {
  const admin = await requireAdmin();

  const projectId = formData.get("project_id");
  const parentFolderId = formData.get("parent_folder_id");
  const name = formData.get("name");

  if (typeof projectId !== "string" || !projectId) throw new Error("Projet invalide.");
  if (typeof name !== "string" || !name.trim()) throw new Error("Nom de dossier requis.");

  const { data: project } = await supabaseAdmin.from("projects").select("client_id").eq("id", projectId).maybeSingle();
  if (!project) throw new Error("Projet introuvable.");

  const parentFolderIdValue = typeof parentFolderId === "string" && parentFolderId ? parentFolderId : null;

  const { error } = await supabaseAdmin.from("document_folders").insert({
    project_id: projectId,
    client_id: project.client_id,
    parent_folder_id: parentFolderIdValue,
    name: name.trim(),
  });

  if (error) throw new Error("La création du dossier a échoué (nom déjà utilisé à cet emplacement ?).");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: project.client_id,
    projectId,
    type: "document",
    title: `Dossier créé : ${name.trim()}`,
    adminTitle: `${actorName} a créé le dossier ${name.trim()}`,
    actorId: admin.id,
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function renameDocumentFolder(folderId: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) throw new Error("Nom de dossier requis.");

  const { data: folder } = await supabaseAdmin.from("document_folders").select("project_id").eq("id", folderId).maybeSingle();
  if (!folder) throw new Error("Dossier introuvable.");

  const { error } = await supabaseAdmin.from("document_folders").update({ name: name.trim() }).eq("id", folderId);
  if (error) throw new Error("Le renommage a échoué (nom déjà utilisé à cet emplacement ?).");

  revalidatePath(`/admin/projects/${folder.project_id}`);
}

// Safe by construction: documents.folder_id is ON DELETE SET NULL (files move
// to the project root, never deleted) and document_folders.parent_folder_id
// is ON DELETE CASCADE (only empty folder rows disappear, chained the same
// way down the tree) — see 20260822100000_add_document_folders.sql.
export async function deleteDocumentFolder(folderId: string) {
  await requireAdmin();

  const { data: folder } = await supabaseAdmin.from("document_folders").select("project_id").eq("id", folderId).maybeSingle();
  if (!folder) throw new Error("Dossier introuvable.");

  const { error } = await supabaseAdmin.from("document_folders").delete().eq("id", folderId);
  if (error) throw new Error("La suppression a échoué.");

  revalidatePath(`/admin/projects/${folder.project_id}`);
}

export async function uploadProjectDocument(formData: FormData) {
  const admin = await requireAdmin();

  const projectId = formData.get("project_id");
  const folderId = formData.get("folder_id");
  const file = formData.get("file");

  if (typeof projectId !== "string" || !projectId) throw new Error("Projet invalide.");
  if (!(file instanceof File) || file.size === 0) throw new Error("Fichier invalide.");

  const { data: project } = await supabaseAdmin.from("projects").select("client_id").eq("id", projectId).maybeSingle();
  if (!project) throw new Error("Projet introuvable.");

  const folderIdValue = typeof folderId === "string" && folderId ? folderId : null;

  const documentId = crypto.randomUUID();
  const storagePath = `${project.client_id}/documents/${documentId}-${file.name}`;
  await uploadClientFile(storagePath, file);

  const { error } = await supabaseAdmin.from("documents").insert({
    id: documentId,
    client_id: project.client_id,
    project_id: projectId,
    folder_id: folderIdValue,
    filename: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: admin.id,
  });

  if (error) throw new Error("L'enregistrement du document a échoué.");

  const actorName = await getActorDisplayName(admin.id);
  await logActivity({
    clientId: project.client_id,
    projectId,
    type: "document",
    title: `Nouveau document : ${file.name}`,
    adminTitle: `${actorName} a ajouté ${file.name}`,
    actorId: admin.id,
  });

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function getDocumentPreviewUrl(documentId: string): Promise<{ url: string; mimeType: string | null }> {
  await requireAdmin();

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("storage_path, mime_type")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) throw new Error("Document introuvable.");

  const url = await createSignedDownloadUrl(doc.storage_path, 300);
  if (!url) throw new Error("Aperçu indisponible.");

  return { url, mimeType: doc.mime_type };
}

export async function deleteProjectDocument(documentId: string) {
  await requireAdmin();

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("project_id, storage_path")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) throw new Error("Document introuvable.");

  const { error } = await supabaseAdmin.from("documents").delete().eq("id", documentId);
  if (error) throw new Error("La suppression a échoué.");

  await deleteClientFile(doc.storage_path);

  if (doc.project_id) revalidatePath(`/admin/projects/${doc.project_id}`);
}

export async function downloadProjectDocument(formData: FormData) {
  await requireAdmin();

  const documentId = formData.get("document_id");
  if (typeof documentId !== "string" || !documentId) throw new Error("Document invalide.");

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("storage_path, filename")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) throw new Error("Document introuvable.");

  const url = await createSignedDownloadUrl(doc.storage_path, 60, doc.filename);
  if (!url) throw new Error("Le téléchargement a échoué.");

  redirect(url);
}

export async function createPhase(projectId: string, name: string) {
  await requireAdmin();
  if (!name.trim()) throw new Error("Nom de phase requis.");

  const { count } = await supabaseAdmin.from("project_phases").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  const { error } = await supabaseAdmin.from("project_phases").insert({ project_id: projectId, name: name.trim(), position: count ?? 0 });
  if (error) throw new Error("La création de la phase a échoué.");

  revalidatePath(`/admin/projects/${projectId}`);
}

// Convenience insert of KOV's own example phase set (see KOV_DEFAULT_PHASES)
// — not an auto-seed, only fires when the admin clicks the button. Appends
// after whatever phases already exist rather than replacing them.
export async function addDefaultPhases(projectId: string, names: readonly string[]) {
  await requireAdmin();

  const { count } = await supabaseAdmin.from("project_phases").select("id", { count: "exact", head: true }).eq("project_id", projectId);
  const startPosition = count ?? 0;

  const { error } = await supabaseAdmin
    .from("project_phases")
    .insert(names.map((name, index) => ({ project_id: projectId, name, position: startPosition + index })));
  if (error) throw new Error("L'ajout des phases a échoué.");

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function renamePhase(phaseId: string, projectId: string, name: string) {
  await requireAdmin();
  if (!name.trim()) throw new Error("Nom de phase requis.");

  const { error } = await supabaseAdmin.from("project_phases").update({ name: name.trim(), updated_at: new Date().toISOString() }).eq("id", phaseId);
  if (error) throw new Error("Le renommage a échoué.");

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updatePhaseStatus(phaseId: string, projectId: string, status: string) {
  await requireAdmin();
  if (!isProjectPhaseStatus(status)) throw new Error("Statut invalide.");

  const { error } = await supabaseAdmin.from("project_phases").update({ status, updated_at: new Date().toISOString() }).eq("id", phaseId);
  if (error) throw new Error("La mise à jour a échoué.");

  revalidatePath(`/admin/projects/${projectId}`);
}

export async function deletePhase(phaseId: string, projectId: string) {
  await requireAdmin();

  const { error } = await supabaseAdmin.from("project_phases").delete().eq("id", phaseId);
  if (error) throw new Error("La suppression a échoué.");

  revalidatePath(`/admin/projects/${projectId}`);
}
