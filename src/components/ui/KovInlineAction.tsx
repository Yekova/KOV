"use client";

import { KovInlineLoader } from "@/components/ui/KovSpinner";
import { useKovAction } from "@/lib/useKovAction";

// L'action discrète : archiver, désactiver, supprimer.
//
// Ces boutons-là sont du texte posé au bout d'une ligne, pas des pastilles.
// KovActionButton mesure 46 px de haut — le poser ici ferait d'une action
// secondaire l'élément le plus lourd de la ligne, ce qui est exactement
// l'inverse de ce qu'elle est.
//
// Ce qui leur manquait n'était donc pas une pastille, c'était le cycle :
// les trois écrivaient « … » pendant l'attente, puis plus rien. Archiver un
// client réussissait en silence. L'erreur, elle, s'affichait en petit à
// côté — au seul endroit où personne ne regarde après avoir cliqué.
//
// Ici : les trois points de KovInlineLoader pendant l'attente (le loader
// prévu pour cette échelle), et un toast pour le résultat, succès comme
// échec. Le toast est le bon support parce qu'après un archivage la ligne
// elle-même a souvent disparu de l'écran.
export function KovInlineAction({
  label,
  pendingLabel,
  confirmMessage,
  success,
  fallbackError,
  onRun,
  className = "",
}: {
  label: string;
  /** Le mot affiché pendant l'attente, à côté des points. */
  pendingLabel?: string;
  /** Demandé avant de lancer. Omis, l'action part au clic. */
  confirmMessage?: string;
  success: string;
  fallbackError: string;
  onRun: () => Promise<void>;
  className?: string;
}) {
  const action = useKovAction({ success, fallbackError });
  const busy = action.state === "loading";

  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={() => {
        // window.confirm reste pour l'instant : le remplacer partout est un
        // chantier à part (une vingtaine d'appels), et une confirmation
        // native vaut mieux qu'une suppression sans garde.
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        action.run(onRun);
      }}
      className={`text-kov-steel hover:text-kov-red text-xs tracking-widest uppercase transition-colors disabled:opacity-50 ${className}`}
    >
      {busy ? <KovInlineLoader label={pendingLabel} /> : label}
    </button>
  );
}
