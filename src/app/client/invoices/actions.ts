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
