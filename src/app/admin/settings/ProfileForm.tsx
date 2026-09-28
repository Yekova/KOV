"use client";

import { useState, useTransition, type FormEvent } from "react";
import { updateMyProfile } from "./actions";
import { Button } from "@/components/ui/Button";
import { AvatarField } from "@/components/ui/AvatarField";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function ProfileForm({
  fullName,
  displayTitle,
  phone,
  avatarUrl,
}: {
  fullName: string | null;
  displayTitle: string | null;
  phone: string | null;
  avatarUrl: string | null;
}) {
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
        await updateMyProfile(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'enregistrement a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
      {/* C'est la photo que vos clients voient sur « votre chef de projet »
          et sur la page Équipe, pas une coquetterie de réglages. */}
      <div className="sm:col-span-2">
        <AvatarField currentUrl={avatarUrl} name={fullName} label="Votre photo, vue par vos clients" />
      </div>

      <label className="text-xs text-kov-steel">
        Nom
        <input name="full_name" defaultValue={fullName ?? ""} required className={`kov-field ${FIELD_CLASS}`} style={{ borderColor: "var(--kov-border)" }} />
      </label>
      <label className="text-xs text-kov-steel">
        Titre affiché
        <input name="display_title" defaultValue={displayTitle ?? ""} placeholder="Chef de projet" className={`kov-field ${FIELD_CLASS}`} style={{ borderColor: "var(--kov-border)" }} />
        <span className="mt-1 block text-[11px] text-kov-steel">
          Ce que vos clients lisent sous votre nom.
        </span>
      </label>
      <label className="text-xs text-kov-steel">
        Téléphone
        <input name="phone" type="tel" defaultValue={phone ?? ""} placeholder="06 12 34 56 78" className={`kov-field ${FIELD_CLASS}`} style={{ borderColor: "var(--kov-border)" }} />
        <span className="mt-1 block text-[11px] text-kov-steel">
          Interne : il n&apos;apparaît pas dans l&apos;espace client.
        </span>
      </label>
      <div className="sm:col-span-2 flex items-center gap-4">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {error && <p className="text-kov-red text-sm">{error}</p>}
        {saved && !error && <p className="text-kov-steel text-sm">Enregistré ✓</p>}
      </div>
    </form>
  );
}
