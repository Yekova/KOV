"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";

// Generic by document ID (not scoped to one project), so this is shared by
// both the cross-project /client/documents view and the per-project GED at
// /client/projects/[id].
export async function getClientDocumentPreviewUrl(documentId: string): Promise<{ url: string; mimeType: string | null }> {
  const user = await requireUser();

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("client_id, storage_path, mime_type")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || doc.client_id !== user.id) throw new Error("Accès refusé.");

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
    .select("client_id, storage_path, filename")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc || doc.client_id !== user.id) throw new Error("Accès refusé.");

  const url = await createSignedDownloadUrl(doc.storage_path, 60, doc.filename);
  if (!url) throw new Error("Le téléchargement a échoué.");

  redirect(url);
}
