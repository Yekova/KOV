"use client";

import { useRef, useState } from "react";
import type { AvatarPreset } from "@/lib/portal/avatarPresets";

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
// Il ne poste rien lui-même. Il expose trois entrées — le fichier, un
// choix parmi les avatars proposés, et une case de retrait — que le
// formulaire qui l'accueille envoie avec le reste. Une photo et un nom se
// modifient d'un même geste.
//
// ── LES AVATARS PROPOSÉS ─────────────────────────────────────────────
//
// Ils ne sont affichés que si on lui en donne. C'est ce qui permet de les
// ouvrir au portail client sans les imposer au profil du studio, où la
// photo n'est pas décorative : c'est celle que les clients voient sur la
// carte « votre chef de projet ».

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export function AvatarField({
  currentUrl,
  name,
  label = "Photo",
  presets,
}: {
  currentUrl: string | null;
  /** Pour l'initiale de repli, et pour le texte alternatif. */
  name: string | null;
  label?: string;
  /** Omis, aucune galerie ne s'affiche et le champ se comporte comme
   *  avant. */
  presets?: AvatarPreset[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  // Le chemin choisi, ou null. Il sert à deux choses : poster la valeur,
  // et savoir quelle vignette porter la marque de sélection.
  const [preset, setPreset] = useState<string | null>(
    presets?.some((entry) => entry.path === currentUrl) ? currentUrl : null
  );

  const shown = removed ? null : (preview ?? preset ?? currentUrl);
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";

  function pick(file: File | null) {
    if (!file) return;
    setRemoved(false);
    // Choisir son propre fichier annule la vignette sélectionnée : les
    // deux partent dans le même formulaire, et l'aperçu doit montrer
    // celui qui l'emportera côté serveur.
    setPreset(null);
    // Un aperçu local : on ne fait pas attendre l'aller-retour serveur
    // pour savoir ce qu'on vient de choisir.
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  }

  function choosePreset(path: string) {
    setRemoved(false);
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
    setPreset(path);
  }

  function clear() {
    setRemoved(true);
    setPreset(null);
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
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
          <p className="text-kov-concrete text-xs tracking-widest uppercase">{label}</p>

          <input
            ref={inputRef}
            type="file"
            name="avatar"
            accept={ACCEPT}
            className="sr-only"
            aria-label={label}
            onChange={(event) => pick(event.target.files?.[0] ?? null)}
          />
          {/* Le retrait voyage dans une entrée cachée ; le choix, lui, est
              porté par les boutons radio plus bas, qui sont déjà des
              champs de formulaire. Rien n'est posté deux fois. */}
          <input type="hidden" name="avatar_remove" value={removed ? "1" : ""} />

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-kov-bone hover:border-kov-red hover:text-kov-red border px-3 py-2 text-xs tracking-widest uppercase transition-colors"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            >
              {shown ? "Changer" : "Choisir une photo"}
            </button>

            {shown && (
              <button
                type="button"
                onClick={clear}
                className="text-kov-concrete hover:text-kov-red px-2 py-2 text-xs underline-offset-4 transition-colors hover:underline"
              >
                Retirer
              </button>
            )}
          </div>

          <p className="text-kov-concrete/70 mt-2 text-[11px]">JPEG, PNG, WebP ou AVIF — 4 Mo maximum.</p>
        </div>
      </div>

      {presets && presets.length > 0 && (
        <fieldset>
          <legend className="text-kov-concrete text-xs tracking-widest uppercase">
            Ou choisissez un avatar
          </legend>
          {/* Des boutons radio, pas des boutons : un seul avatar peut être
              retenu, et la navigation au clavier entre des radios se fait
              aux flèches, ce qui est le bon geste pour une galerie. */}
          <div className="mt-3 flex flex-wrap gap-3">
            {presets.map((entry) => {
              const selected = preset === entry.path;
              return (
                <label
                  key={entry.id}
                  className="kov-avatar-choice"
                  data-selected={selected || undefined}
                  title={entry.label}
                >
                  <input
                    type="radio"
                    name="avatar_preset"
                    value={entry.path}
                    checked={selected}
                    onChange={() => choosePreset(entry.path)}
                    className="sr-only"
                  />
                  {/* Fichier statique du dépôt, de taille fixe et déjà
                      dimensionné : next/image n'aurait rien à optimiser. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.path} alt={entry.label} width={56} height={56} loading="lazy" />
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
