"use client";

import { usePathname } from "next/navigation";

// La transition entre deux pages du portail.
//
// Pas un fondu de tout l'écran : la coquille — barre latérale, barre du
// haut, recherche — ne bouge pas. Seul le contenu arrive, et il arrive de
// 4 pixels plus bas. C'est assez pour que l'œil enregistre « c'est une
// autre page » et trop peu pour qu'on attende quoi que ce soit.
//
// La clé est le chemin : React démonte et remonte, donc l'animation rejoue
// à chaque navigation. Sans elle, elle ne se déclencherait qu'une fois,
// au premier rendu.
//
// Le div n'a aucun style de mise en page : il doit être transparent pour
// la grille qu'il contient.
export function PortalPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="kov-page flex-1">
      {children}
    </div>
  );
}
