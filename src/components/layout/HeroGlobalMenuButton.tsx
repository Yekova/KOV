"use client";

import { GlobalMenuButton } from "@/components/layout/GlobalMenuButton";
import { useGlobalMenu } from "@/components/layout/GlobalMenuContext";

// Petite enveloppe cliente pour le bouton de menu « contained ».
//
// Elle existait parce que HeroScene était un composant SERVEUR et ne
// pouvait pas appeler useGlobalMenu(). Cette raison a disparu : HeroStage,
// qui l'a remplacé, est un composant client. Elle reste parce qu'elle
// garde le contexte du menu hors de la scène — laquelle écrit déjà dans
// le DOM à chaque image de défilement et n'a pas besoin d'un abonnement
// de plus qui la ferait rendre.
export function HeroGlobalMenuButton() {
  const { open, toggle } = useGlobalMenu();
  return <GlobalMenuButton variant="contained" open={open} onToggle={toggle} />;
}
