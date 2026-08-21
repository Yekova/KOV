"use client";

import { useState, useTransition, type FormEvent } from "react";
import { updateBusinessSettings } from "./actions";
import { Button } from "@/components/ui/Button";
import type { BusinessInfo } from "@/lib/billing/businessInfo";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function SettingsForm({ businessInfo }: { businessInfo: BusinessInfo }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateBusinessSettings(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="text-xs text-kov-steel">
          Nom légal
          <input name="legal_name" defaultValue={businessInfo.legalName} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Nom commercial
          <input name="commercial_name" defaultValue={businessInfo.commercialName} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel sm:col-span-2">
          Forme juridique
          <input name="legal_form" defaultValue={businessInfo.legalForm} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel sm:col-span-2">
          Adresse
          <input name="address_street" defaultValue={businessInfo.address.street} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Code postal
          <input name="address_postal_code" defaultValue={businessInfo.address.postalCode} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Ville
          <input name="address_city" defaultValue={businessInfo.address.city} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel sm:col-span-2">
          Pays
          <input name="address_country" defaultValue={businessInfo.address.country} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          SIRET
          <input name="siret" defaultValue={businessInfo.siret} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          SIREN
          <input name="siren" defaultValue={businessInfo.siren} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Code APE
          <input name="ape_code" defaultValue={businessInfo.apeCode} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          Délai de paiement (jours)
          <input type="number" name="payment_terms_days" min={0} defaultValue={businessInfo.paymentTermsDays} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel sm:col-span-2">
          Mention TVA
          <input name="vat_mention" defaultValue={businessInfo.vatMention} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          IBAN
          <input name="iban" defaultValue={businessInfo.iban} required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel">
          BIC (facultatif)
          <input name="bic" defaultValue={businessInfo.bic} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
        <label className="text-xs text-kov-steel sm:col-span-2">
          Mention de pénalité de retard
          <textarea name="late_payment_mention" defaultValue={businessInfo.latePaymentMention} required rows={3} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        </label>
      </div>

      {error && <p className="text-kov-red text-sm">{error}</p>}
      {saved && !error && <p className="text-kov-steel text-sm">Paramètres enregistrés.</p>}

      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
