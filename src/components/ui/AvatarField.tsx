"use client";

import { useRef, useState } from "react";

// Le champ avatar, et il sert aux deux côtés.
//
// profiles.avatar_path est lu à dix-sept endroits de l'application — barre
// du haut du portail, carte du chef de projet, page Équipe, fiches clients,
// équipes de projet, fils de demandes — et rien ne l'écrivait nulle part.
// Tous les avatars retombaient donc sur une initiale, y compris celui du
// chef de projet que le client voit sur son tableau de bord.
//
// Le même composant sert au profil client et au profil admin : c'est la
// même donnée, dans la même colonne, et l'avatar de l'admin est
// précisément celui que le client regarde.
//
// Il ne poste rien lui-même. Il expose deux entrées — le fichier et une
// case de retrait — que le formulaire qui l'accueille envoie avec le
// reste. Une photo et un nom se modifient d'un même geste.

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export function AvatarField({
  currentUrl,
  name,
  label = "Photo",
}: {
  currentUrl: string | null;
  /** Pour l'initiale de repli, et pour le texte alternatif. */
  name: string | null;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  const shown = removed ? null : (preview ?? currentUrl);
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";

  function pick(file: File | null) {
    if (!file) return;
    setRemoved(false);
    // Un aperçu local : on ne fait pas attendre l'aller-retour serveur
    // pour savoir ce qu'on vient de choisir.
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  }

  return (
    <div className="flex items-center gap-4">
      {/* Une image quand il y en a une, l'initiale sinon — jamais un
          bonhomme générique, qui ne distingue personne de personne. */}
      <span
        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden"
        style={{
          borderRadius: "var(--radius-pill)",
          background: "var(--kov-graphite)",
          border: "1px solid var(--kov-border)",
        }}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={name ? `Photo de ${name}` : "Votre photo"} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true" className="font-display text-kov-concrete text-xl">
            {initial}
          </span>
        )}
      </span>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-kov-concrete">{label}</p>

        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept={ACCEPT}
          className="sr-only"
          aria-label={label}
          onChange={(event) => pick(event.target.files?.[0] ?? null)}
        />
        {/* La case suit l'état : le formulaire reçoit le retrait sans que
            le composant ait à poster quoi que ce soit lui-même. */}
        <input type="hidden" name="avatar_remove" value={removed ? "1" : ""} />

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="border px-3 py-2 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-red hover:text-kov-red"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            {shown ? "Changer" : "Choisir une photo"}
          </button>

          {shown && (
            <button
              type="button"
              onClick={() => {
                setRemoved(true);
                setPreview((previous) => {
                  if (previous) URL.revokeObjectURL(previous);
                  return null;
                });
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="px-2 py-2 text-xs text-kov-concrete underline-offset-4 transition-colors hover:text-kov-red hover:underline"
            >
              Retirer
            </button>
          )}
        </div>

        <p className="mt-2 text-[11px] text-kov-concrete/70">JPEG, PNG, WebP ou AVIF — 4 Mo maximum.</p>
      </div>
    </div>
  );
}
