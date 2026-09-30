"use client";

import { KovToaster } from "@/components/ui/KovToaster";

// Le portail n'avait aucun <Toaster/>.
//
// Un seul existait dans toute l'application, à la racine de l'admin. Côté
// client, chaque action se terminait donc en silence : le formulaire se
// vidait, et c'était tout. Le succès n'était jamais dit.
//
// Un second montage est sans danger ici : sonner rend une liste par
// Toaster, et /admin et /client sont deux arbres de routes qui ne
// coexistent jamais — ce serait faux à l'intérieur d'un même arbre, ce
// qu'AdminProviders écrit déjà noir sur blanc.
//
// L'habillage et la position vivent dans KovToaster, partagé avec
// l'admin : c'est la même notification des deux côtés, et elle n'a aucune
// raison d'être décrite deux fois.
export function PortalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <KovToaster />
    </>
  );
}
