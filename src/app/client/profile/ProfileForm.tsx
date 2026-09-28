"use client";

import { useRef } from "react";
import { AvatarField } from "@/components/ui/AvatarField";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
import { updateMyProfile } from "./actions";

const FIELD_CLASS =
  "kov-field w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-concrete/70 text-sm focus:outline-none";

const FIELD_STYLE = { borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" };

export interface ClientProfileValues {
  fullName: string | null;
  company: string | null;
  phone: string | null;
  addressStreet: string | null;
  addressPostalCode: string | null;
  addressCity: string | null;
  addressCountry: string | null;
  siren: string | null;
  vatNumber: string | null;
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  placeholder?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block text-xs text-kov-concrete">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={`${FIELD_CLASS} mt-1`}
        style={FIELD_STYLE}
      />
      {hint && <span className="mt-1 block text-[11px] text-kov-concrete/70">{hint}</span>}
    </label>
  );
}

// Le profil du client.
//
// Il tenait deux champs : le nom et l'entreprise. Les colonnes pour le
// reste existent depuis la migration 20260927100100 — téléphone, adresse,
// SIREN, numéro de TVA — et rien, nulle part, ne les écrivait ni ne les
// lisait. Elles avaient été créées pour que les devis et les factures
// portent l'identité légale de leur destinataire, et sont restées vides.
//
// ── POURQUOI DEUX SECTIONS ───────────────────────────────────────────
//
// Ce n'est pas une mise en page, c'est une différence de nature. La
// première est ce qui vous identifie dans l'espace, et que le studio voit.
// La seconde sert aux documents qui engagent : le client doit savoir que ce
// qu'il écrit là finira imprimé sur une facture. La phrase au-dessus le dit.
export function ProfileForm({ values, avatarUrl }: { values: ClientProfileValues; avatarUrl: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = useKovAction({ success: "Profil enregistré.", fallbackError: "L'enregistrement a échoué." });

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        action.run(() => updateMyProfile(formData));
      }}
      className="space-y-8"
    >
      <div className="space-y-5">
        <AvatarField currentUrl={avatarUrl} name={values.fullName} label="Votre photo" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" name="full_name" defaultValue={values.fullName} required autoComplete="name" />
          <Field label="Entreprise" name="company" defaultValue={values.company} autoComplete="organization" />
          <Field
            label="Téléphone"
            name="phone"
            type="tel"
            defaultValue={values.phone}
            placeholder="06 12 34 56 78"
            autoComplete="tel"
            hint="Pour que le studio puisse vous joindre rapidement."
          />
        </div>
      </div>

      <div className="space-y-5 border-t pt-8" style={{ borderColor: "var(--kov-border)" }}>
        <div>
          <p className="text-xs uppercase tracking-widest text-kov-concrete">Identité de facturation</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-kov-concrete">
            Ces informations figurent sur vos devis et vos factures. Laissez vide ce qui ne vous concerne pas — rien
            n&apos;est obligatoire.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field
              label="Adresse"
              name="address_street"
              defaultValue={values.addressStreet}
              placeholder="12 rue de la République"
              autoComplete="street-address"
            />
          </div>
          <Field
            label="Code postal"
            name="address_postal_code"
            defaultValue={values.addressPostalCode}
            placeholder="33000"
            autoComplete="postal-code"
          />
          <Field
            label="Ville"
            name="address_city"
            defaultValue={values.addressCity}
            placeholder="Bordeaux"
            autoComplete="address-level2"
          />
          <Field
            label="Pays"
            name="address_country"
            defaultValue={values.addressCountry}
            placeholder="France"
            autoComplete="country-name"
          />
          <Field label="SIREN" name="siren" defaultValue={values.siren} placeholder="123 456 789" />
          <div className="sm:col-span-2">
            <Field
              label="Numéro de TVA intracommunautaire"
              name="vat_number"
              defaultValue={values.vatNumber}
              placeholder="FR00123456789"
              hint="Seulement si votre entreprise y est assujettie."
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <KovActionButton
          state={action.state}
          onStateSettled={action.reset}
          successLabel="Enregistré"
          variant="secondary"
        >
          Enregistrer
        </KovActionButton>
        {action.error && (
          <p role="alert" className="text-sm" style={{ color: "var(--kov-red)" }}>
            {action.error}
          </p>
        )}
      </div>
    </form>
  );
}
