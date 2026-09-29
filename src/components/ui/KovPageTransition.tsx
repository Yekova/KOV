"use client";

import { usePathname } from "next/navigation";
import "./kovMotion.css";

// La transition entre deux pages, côté admin comme côté client.
//
// Pas un fondu de tout l'écran : la coquille — barre latérale, barre du
// haut, recherche — ne bouge pas. Seul le contenu arrive, et il arrive de
// 4 pixels plus bas. C'est assez pour que l'œil enregistre « c'est une
// autre page » et trop peu pour qu'on attende quoi que ce soit.
//
// La clé est le chemin : React démonte et remonte, donc l'animation rejoue
// à chaque navigation. Sans elle, elle ne se déclencherait qu'une fois, au
// premier rendu.
//
// ── POURQUOI LA CLÉ N'EST PAS TOUJOURS LE CHEMIN ENTIER ──────────────
//
// Changer la clé DÉTRUIT tout le sous-arbre, y compris les layouts de
// section qu'il contient. Dans la messagerie, ce sous-arbre porte la liste
// des conversations : passer d'un fil à l'autre la remontait entièrement —
// défilement perdu, liste qui clignote à chaque clic. Or changer de
// conversation n'est pas changer de page, c'est choisir dans une page.
//
// Pour ces sections, la clé s'arrête au segment de section. Partout
// ailleurs elle reste le chemin complet, parce qu'aller d'une liste à une
// fiche EST un changement de page et mérite son mouvement.
const SECTIONS_WITH_PERSISTENT_LAYOUT = ["/client/requests", "/admin/requests"];

export function KovPageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const section = SECTIONS_WITH_PERSISTENT_LAYOUT.find((prefix) => pathname.startsWith(prefix));

  return (
    <div key={section ?? pathname} className={`kov-page ${className}`}>
      {children}
    </div>
  );
}
