"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateBusinessInfo } from "@/lib/billing/businessInfo";

function requiredField(formData: FormData, name: string, label: string): string {
  const value = formData.get(name);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} requis.`);
  return value.trim();
}

export async function updateBusinessSettings(formData: FormData) {
  await requireAdmin();

  const paymentTermsDaysRaw = formData.get("payment_terms_days");
  const paymentTermsDays = typeof paymentTermsDaysRaw === "string" ? parseInt(paymentTermsDaysRaw, 10) : NaN;
  if (!Number.isFinite(paymentTermsDays) || paymentTermsDays < 0) throw new Error("Délai de paiement invalide.");

  await updateBusinessInfo({
    legalName: requiredField(formData, "legal_name", "Nom légal"),
    commercialName: requiredField(formData, "commercial_name", "Nom commercial"),
    legalForm: requiredField(formData, "legal_form", "Forme juridique"),
    address: {
      street: requiredField(formData, "address_street", "Adresse"),
      postalCode: requiredField(formData, "address_postal_code", "Code postal"),
      city: requiredField(formData, "address_city", "Ville"),
      country: requiredField(formData, "address_country", "Pays"),
    },
    siret: requiredField(formData, "siret", "SIRET"),
    siren: requiredField(formData, "siren", "SIREN"),
    apeCode: requiredField(formData, "ape_code", "Code APE"),
    vatMention: requiredField(formData, "vat_mention", "Mention TVA"),
    iban: requiredField(formData, "iban", "IBAN"),
    bic: (formData.get("bic") as string)?.trim() ?? "",
    paymentTermsDays,
    latePaymentMention: requiredField(formData, "late_payment_mention", "Mention de pénalité de retard"),
  });

  revalidatePath("/admin/settings");
}
