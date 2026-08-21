import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface BusinessInfo {
  legalName: string;
  commercialName: string;
  legalForm: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  siret: string;
  siren: string;
  apeCode: string;
  vatMention: string;
  iban: string;
  bic: string;
  paymentTermsDays: number;
  latePaymentMention: string;
}

// Real, verified values (SIRET/address confirmed via the French government's
// public business registry) — used only if business_settings is ever empty,
// so a broken read never falls back to fabricated data.
const FALLBACK_BUSINESS_INFO: BusinessInfo = {
  legalName: "Mattéo Delorme",
  commercialName: "KOV",
  legalForm: "Entreprise individuelle",
  address: { street: "49 rue André Maginot", postalCode: "33000", city: "Bordeaux", country: "France" },
  siret: "941 801 391 00017",
  siren: "941 801 391",
  apeCode: "62.01Z",
  vatMention: "TVA non applicable, art. 293 B du CGI",
  iban: "FR76 2823 3000 0175 2849 2704 095",
  bic: "",
  paymentTermsDays: 30,
  latePaymentMention:
    "En cas de retard de paiement, une pénalité égale à 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €.",
};

// Admin-editable via /admin/settings — see 20260822150000_create_business_settings.sql.
export async function getBusinessInfo(): Promise<BusinessInfo> {
  const { data } = await supabaseAdmin.from("business_settings").select("*").eq("id", true).maybeSingle();
  if (!data) return FALLBACK_BUSINESS_INFO;

  return {
    legalName: data.legal_name,
    commercialName: data.commercial_name,
    legalForm: data.legal_form,
    address: {
      street: data.address_street,
      postalCode: data.address_postal_code,
      city: data.address_city,
      country: data.address_country,
    },
    siret: data.siret,
    siren: data.siren,
    apeCode: data.ape_code,
    vatMention: data.vat_mention,
    iban: data.iban,
    bic: data.bic,
    paymentTermsDays: data.payment_terms_days,
    latePaymentMention: data.late_payment_mention,
  };
}

export async function updateBusinessInfo(info: BusinessInfo) {
  const { error } = await supabaseAdmin
    .from("business_settings")
    .update({
      legal_name: info.legalName,
      commercial_name: info.commercialName,
      legal_form: info.legalForm,
      address_street: info.address.street,
      address_postal_code: info.address.postalCode,
      address_city: info.address.city,
      address_country: info.address.country,
      siret: info.siret,
      siren: info.siren,
      ape_code: info.apeCode,
      vat_mention: info.vatMention,
      iban: info.iban,
      bic: info.bic,
      payment_terms_days: info.paymentTermsDays,
      late_payment_mention: info.latePaymentMention,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) throw new Error("L'enregistrement des paramètres a échoué.");
}
