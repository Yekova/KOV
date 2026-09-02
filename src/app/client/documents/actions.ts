"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl, uploadClientFile } from "@/lib/portal/storage";
import { logActivity, getActorDisplayName } from "@/lib/activity";

// Generic by document ID (not scoped to one project), so this is shared by
// both the cross-project /client/documents view and the per-project GED at
// /client/projects/[id].
export async function getClientDocumentPreviewUrl(documentId: string): Promise<{ url: string; mimeType: string | null }> {
  const user = await requireUser();

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("client_id, storage_path, mime_type, visibility")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.client_id !== user.id || doc.visibility !== "client") throw new Error("Accès refusé.");

  const url = await createSignedDownloadUrl(doc.storage_path, 300);
  if (!url) throw new Error("Aperçu indisponible.");

  return { url, mimeType: doc.mime_type };
}

export async function downloadDocument(formData: FormData) {
  const user = await requireUser();

  const documentId = formData.get("document_id");
  if (typeof documentId !== "string" || !documentId) throw new Error("Document invalide.");

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("client_id, storage_path, filename, visibility")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc || doc.client_id !== user.id || doc.visibility !== "client") throw new Error("Accès refusé.");

  const url = await createSignedDownloadUrl(doc.storage_path, 60, doc.filename);
  if (!url) throw new Error("Le téléchargement a échoué.");

  redirect(url);
}

export async function uploadClientDocument(formData: FormData) {
  const user = await requireUser();

  const projectId = formData.get("project_id");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Fichier invalide.");

  const projectIdValue = typeof projectId === "string" && projectId ? projectId : null;
  if (projectIdValue) {
    const { data: project } = await supabaseAdmin.from("projects").select("client_id").eq("id", projectIdValue).maybeSingle();
    if (!project || project.client_id !== user.id) throw new Error("Projet invalide.");
  }

  const documentId = crypto.randomUUID();
  const storagePath = `${user.id}/documents/${documentId}-${file.name}`;
  await uploadClientFile(storagePath, file);

  const { error } = await supabaseAdmin.from("documents").insert({
    id: documentId,
    client_id: user.id,
    project_id: projectIdValue,
    filename: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
    uploaded_by: user.id,
  });
  if (error) throw new Error("L'envoi du document a échoué.");

  const actorName = await getActorDisplayName(user.id);
  await logActivity({
    clientId: user.id,
    projectId: projectIdValue,
    type: "document",
    title: "Document envoyé",
    adminTitle: `${actorName} a envoyé un fichier : ${file.name}`,
    actorId: user.id,
    description: file.name,
  });

  revalidatePath("/client/documents");
  if (projectIdValue) revalidatePath(`/client/projects/${projectIdValue}`);
  revalidatePath(`/admin/clients/${user.id}`);
}
