"use client";

import { type FormEvent } from "react";
import { updateMyProfile } from "./actions";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
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
  const action = useKovAction({
    success: "Profil enregistré.",
    fallbackError: "L'enregistrement a échoué.",
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    action.run(() => updateMyProfile(formData));
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
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        {/* Le « Enregistré ✓ » posé à la main disparaît : le cercle qui se
            ferme dans le bouton et le toast le disent déjà. */}
        <KovActionButton
          variant="secondary"
          state={action.state}
          onStateSettled={action.reset}
          successLabel="Enregistré"
        >
          Enregistrer
        </KovActionButton>
        {action.error && (
          <p role="alert" className="text-kov-red text-sm">
            {action.error}
          </p>
        )}
      </div>
    </form>
  );
}
