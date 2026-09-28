"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSignedDownloadUrl } from "@/lib/portal/storage";

export async function downloadInvoice(formData: FormData) {
  const user = await requireUser();

  const invoiceId = formData.get("invoice_id");
  if (typeof invoiceId !== "string" || !invoiceId) throw new Error("Facture invalide.");

  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select("client_id, pdf_storage_path")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice || invoice.client_id !== user.id) throw new Error("Accès refusé.");
  if (!invoice.pdf_storage_path) throw new Error("Aucun PDF disponible pour cette facture.");

  const url = await createSignedDownloadUrl(invoice.pdf_storage_path);
  if (!url) throw new Error("Le téléchargement a échoué.");

  redirect(url);
}

// L'aperçu, pour les deux natures de document.
//
// Le panneau de droite de /client/invoices montre le PDF du document
// sélectionné, qu'il soit devis ou facture. Une seule action plutôt que
// deux, parce que le panneau ne connaît qu'un « document » — c'est ici
// que la nature se traduit en emplacement de fichier.
//
// L'URL signée est courte (5 min) : elle sert à afficher, pas à partager.
export async function getClientBillingPdfUrl(kind: "quote" | "invoice", id: string): Promise<string> {
  const user = await requireUser();

  if (kind === "quote") {
    const { data: quote } = await supabaseAdmin.from("quotes").select("client_id").eq("id", id).maybeSingle();
    if (!quote || quote.client_id !== user.id) throw new Error("Accès refusé.");
    const url = await createSignedDownloadUrl(`quotes/${id}.pdf`, 300);
    if (!url) throw new Error("Aperçu indisponible.");
    return url;
  }

  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select("client_id, pdf_storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!invoice || invoice.client_id !== user.id) throw new Error("Accès refusé.");
  if (!invoice.pdf_storage_path) throw new Error("Aucun PDF disponible pour cette facture.");
  const url = await createSignedDownloadUrl(invoice.pdf_storage_path, 300);
  if (!url) throw new Error("Aperçu indisponible.");
  return url;
}

// Le téléchargement, pour les deux natures. Même raison : le tableau a un
// seul bouton, il ne doit pas connaître deux chemins.
export async function downloadBillingDocument(formData: FormData) {
  const user = await requireUser();

  const kind = formData.get("kind");
  const id = formData.get("id");
  if ((kind !== "quote" && kind !== "invoice") || typeof id !== "string" || !id) {
    throw new Error("Document invalide.");
  }

  if (kind === "quote") {
    const { data: quote } = await supabaseAdmin.from("quotes").select("client_id, reference").eq("id", id).maybeSingle();
    if (!quote || quote.client_id !== user.id) throw new Error("Accès refusé.");
    const url = await createSignedDownloadUrl(`quotes/${id}.pdf`, 60, `${quote.reference}.pdf`);
    if (!url) throw new Error("Le téléchargement a échoué.");
    redirect(url);
  }

  const { data: invoice } = await supabaseAdmin
    .from("invoices")
    .select("client_id, pdf_storage_path, reference")
    .eq("id", id)
    .maybeSingle();
  if (!invoice || invoice.client_id !== user.id) throw new Error("Accès refusé.");
  if (!invoice.pdf_storage_path) throw new Error("Aucun PDF disponible pour cette facture.");
  const url = await createSignedDownloadUrl(invoice.pdf_storage_path, 60, `${invoice.reference}.pdf`);
  if (!url) throw new Error("Le téléchargement a échoué.");
  redirect(url);
}
