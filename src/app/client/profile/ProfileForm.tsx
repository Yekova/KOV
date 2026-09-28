"use client";

import { useRef } from "react";
import { AvatarField } from "@/components/ui/AvatarField";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
import { updateMyProfile } from "./actions";

const FIELD_CLASS =
  "kov-field w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-concrete/70 text-sm focus:outline-none";

export function ProfileForm({
  fullName,
  company,
  avatarUrl,
}: {
  fullName: string | null;
  company: string | null;
  avatarUrl: string | null;
}) {
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
      className="max-w-md space-y-5"
    >
      <AvatarField currentUrl={avatarUrl} name={fullName} label="Votre photo" />

      <label className="block text-xs text-kov-concrete">
        Nom
        <input
          name="full_name"
          defaultValue={fullName ?? ""}
          required
          className={`${FIELD_CLASS} mt-1`}
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
      </label>

      <label className="block text-xs text-kov-concrete">
        Entreprise
        <input
          name="company"
          defaultValue={company ?? ""}
          className={`${FIELD_CLASS} mt-1`}
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <KovActionButton state={action.state} onStateSettled={action.reset} successLabel="Enregistré" variant="secondary">
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
