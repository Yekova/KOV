"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";

export async function downloadDocument(formData: FormData) {
  const user = await requireUser();

  const documentId = formData.get("document_id");
  if (typeof documentId !== "string" || !documentId) throw new Error("Document invalide.");

  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("client_id, storage_path")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc || doc.client_id !== user.id) throw new Error("Accès refusé.");

  const url = await createSignedDownloadUrl(doc.storage_path);
  if (!url) throw new Error("Le téléchargement a échoué.");

  redirect(url);
}
