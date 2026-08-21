"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";

export async function getClientQuotePdfUrl(quoteId: string): Promise<string> {
  const user = await requireUser();

  const { data: quote } = await supabaseAdmin.from("quotes").select("client_id").eq("id", quoteId).maybeSingle();
  if (!quote || quote.client_id !== user.id) throw new Error("Accès refusé.");

  const url = await createSignedDownloadUrl(`quotes/${quoteId}.pdf`);
  if (!url) throw new Error("Aperçu indisponible.");

  return url;
}

export async function downloadClientQuotePdf(formData: FormData) {
  const user = await requireUser();

  const quoteId = formData.get("quote_id");
  if (typeof quoteId !== "string" || !quoteId) throw new Error("Devis invalide.");

  const { data: quote } = await supabaseAdmin.from("quotes").select("client_id, reference").eq("id", quoteId).maybeSingle();
  if (!quote || quote.client_id !== user.id) throw new Error("Accès refusé.");

  const url = await createSignedDownloadUrl(`quotes/${quoteId}.pdf`, 60, `${quote.reference}.pdf`);
  if (!url) throw new Error("Le téléchargement a échoué.");

  redirect(url);
}
