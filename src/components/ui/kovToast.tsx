"use client";

import { toast } from "sonner";

// Les deux notifications que la forme de sonner ne sait pas produire.
//
// Un succès, une erreur, un avertissement et une information passent par
// `toast.success(...)` & co. et sont habillés par kovToast.css — les 188
// appels existants n'ont rien à changer.
//
// Restent deux cas que la maquette demande et que sonner ne couvre pas :
// une progression chiffrée, et un message signé d'un visage. Ils sont
// rendus par `toast.custom`, qui insère du JSX à la place du contenu
// standard. On renvoie un fragment, jamais un conteneur : la carte est
// déjà une rangée flex, et l'envelopper la réduirait à une seule colonne.

function CloseButton({ id }: { id: string | number }) {
  return (
    <button
      type="button"
      onClick={() => toast.dismiss(id)}
      className="kov-toast__close"
      aria-label="Fermer la notification"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

/**
 * Le téléversement en cours.
 *
 * Renvoie l'identifiant du toast : l'appelant le repasse à chaque
 * avancée, ce qui met la même carte à jour au lieu d'en empiler une par
 * pour-cent. Il ne se ferme pas tout seul — un transfert dure ce qu'il
 * dure, et une carte qui disparaît à mi-chemin laisse croire à un échec.
 */
export function toastUpload(params: {
  filename: string;
  percent: number;
  id?: string | number;
  label?: string;
}): string | number {
  const percent = Math.max(0, Math.min(100, Math.round(params.percent)));

  return toast.custom(
    (id) => (
      <>
        <span className="kov-toast__file" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>

        <span className="kov-toast__body">
          <span className="kov-toast__row">
            <span className="kov-toast__title">{params.label ?? "Téléversement en cours…"}</span>
            <span className="kov-toast__percent">{percent} %</span>
          </span>
          <span className="kov-toast__desc">{params.filename}</span>
          <span
            className="kov-toast__track"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Téléversement de ${params.filename}`}
          >
            <span className="kov-toast__fill" style={{ width: `${percent}%` }} />
          </span>
        </span>

        <CloseButton id={id} />
      </>
    ),
    {
      id: params.id,
      // Une minuterie n'aurait aucun sens ici : c'est la progression qui
      // dit où l'on en est, et la jauge du bas est donc masquée.
      duration: Infinity,
      className: "kov-toast kov-toast--persistent",
    }
  );
}

/**
 * Un message reçu, signé d'un visage.
 *
 * `avatarUrl` peut être nul : l'initiale prend alors le relais, comme
 * partout ailleurs dans le portail. Aucun visage générique n'est
 * substitué — il ne distinguerait personne de personne.
 */
export function toastMessage(params: {
  author: string;
  excerpt: string;
  avatarUrl?: string | null;
  onOpen?: () => void;
  actionLabel?: string;
}): string | number {
  const initial = params.author.trim().charAt(0).toUpperCase() || "?";

  return toast.custom(
    (id) => (
      <>
        <span className="kov-toast__avatar">
          {params.avatarUrl ? (
            // URL signée ou fichier statique selon le profil : hors du
            // champ de next/image, qui la réécrirait.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={params.avatarUrl} alt="" />
          ) : (
            <span className="kov-toast__initial" aria-hidden="true">
              {initial}
            </span>
          )}
          <span className="kov-toast__unread" aria-hidden="true" />
        </span>

        <span className="kov-toast__body">
          <span className="kov-toast__title">Nouveau message de {params.author}</span>
          <span className="kov-toast__desc">«&nbsp;{params.excerpt}&nbsp;»</span>
        </span>

        {params.onOpen && (
          <button
            type="button"
            className="kov-toast__action"
            onClick={() => {
              params.onOpen?.();
              toast.dismiss(id);
            }}
          >
            {params.actionLabel ?? "Voir"}
          </button>
        )}

        <CloseButton id={id} />
      </>
    ),
    { className: "kov-toast kov-toast--message" }
  );
}
