"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { KovSpinner } from "@/components/ui/KovSpinner";
import "./kovMotion.css";

// Le bouton qui rend compte de ce qu'il fait.
//
// Les six actions du portail avaient toutes le même bouton : un libellé
// qui passait de « Envoyer » à « Envoi… » et un texte d'erreur en dessous.
// Aucune n'avait d'état de succès — le formulaire se vidait, et c'était au
// client de deviner que ça avait marché.
//
// Le cycle est maintenant complet et toujours le même :
//   repos → chargement → succès (ou erreur) → repos
//
// ── LES DEUX SIGNATURES KOV ──────────────────────────────────────────
//
// 1. LE POINT ROUGE, pendant le chargement. Il apparaît, bat, et part.
//    C'est le seul mouvement du bouton : pas de barre, pas de pulsation
//    du bouton entier. Réservé aux actions qui engagent — envoyer,
//    valider, signer — et jamais posé sur une navigation.
//
// 2. LE CERCLE QUI SE FERME, au succès. Le trait se dessine puis le
//    check apparaît dedans. C'est une confirmation, donc elle a le droit
//    de durer un peu — mais elle s'efface seule après un temps court,
//    parce qu'un bouton qui reste bloqué sur « Envoyé » ne se réutilise
//    plus.
//
// Ces deux-là, et le trait rouge qui remplit une progression, sont les
// trois seules signatures d'interaction du portail. Tout le reste est du
// fondu et du glissement.

export type ActionState = "idle" | "loading" | "success" | "error";

/** Combien de temps le succès reste affiché avant que le bouton revienne. */
const SUCCESS_HOLD_MS = 1600;

export function KovActionButton({
  children,
  state,
  onStateSettled,
  loadingLabel,
  successLabel = "Envoyé",
  errorLabel = "Échec",
  variant = "primary",
  type = "submit",
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  state: ActionState;
  /** Appelé quand le bouton a fini de montrer son succès ou son erreur,
   *  pour que le parent revienne à "idle" sans gérer de minuterie. */
  onStateSettled?: () => void;
  /** Ce que l'attente est en train de faire, quand ce n'est pas évident.
   *  Omis, le libellé ne change pas — c'est le point rouge qui dit que
   *  ça travaille. À réserver aux actions longues dont l'étape n'est pas
   *  devinable : « Génération du PDF… » vaut mieux que « Créer le devis »
   *  figé pendant trois secondes. */
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  variant?: "primary" | "secondary";
  type?: "submit" | "button";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  // Le rappel est gardé dans un ref pour que la minuterie ci-dessous ne
  // redémarre pas quand le parent en recrée un à chaque rendu. L'écriture
  // se fait dans un effet et non pendant le rendu : écrire un ref pendant
  // le rendu casse la promesse de pureté que React (et le compilateur)
  // tiennent pour acquise.
  const settledRef = useRef(onStateSettled);
  useEffect(() => {
    settledRef.current = onStateSettled;
  });

  useEffect(() => {
    if (state !== "success" && state !== "error") return;
    const timer = window.setTimeout(() => settledRef.current?.(), SUCCESS_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const busy = state === "loading";
  const label =
    state === "success"
      ? successLabel
      : state === "error"
        ? errorLabel
        : busy && loadingLabel
          ? loadingLabel
          : children;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      // aria-live sur le bouton lui-même : le changement de libellé EST le
      // message. Sans ça, un lecteur d'écran entend « Envoyer » puis plus
      // rien, et l'utilisateur ne sait pas si l'action a abouti.
      aria-live="polite"
      aria-busy={busy}
      data-state={state}
      className={`kov-action kov-action--${variant} kov-rise${
        variant === "primary" ? " kov-rise--solid" : ""
      } ${className}`}
    >
      <span className="kov-action__label">{label}</span>

      {busy && (
        <>
          {/* Sur le bouton primaire — fond rouge — un segment rouge ne se
              voit pas. L'accent passe au blanc pour que l'anneau garde son
              segment identifiable. */}
          <KovSpinner size={15} accent={variant === "primary" ? "var(--kov-white)" : "var(--kov-red)"} />
          {/* La première signature : un point qui bat pendant l'attente. */}
          <span aria-hidden="true" className="kov-action__dot" />
        </>
      )}

      {state === "success" && (
        // La seconde signature : le cercle se ferme, le check se dessine.
        <svg aria-hidden="true" className="kov-action__check" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
          <path d="M7.5 12.3l3.2 3.2 6-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {state === "error" && (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7.5v5.2M12 16.3v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
