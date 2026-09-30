"use client";

import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import "./kovToast.css";

// La notification KOV, définie une seule fois pour les deux espaces.
//
// L'admin et le portail montaient chacun leur <Toaster/> avec leurs
// réglages recopiés — et les deux avaient déjà divergé. Un seul
// composant, deux montages : sonner rend une liste par Toaster, et
// /admin et /client sont deux arbres de routes qui ne coexistent jamais.
//
// ── EN HAUT À DROITE, MAIS SOUS LA BARRE ─────────────────────────────
//
// Les deux barres de navigation mesurent 68 px — valeur écrite en dur
// dans AdminTopNavigation et PortalTopNavigation. Le toast commence 12 px
// en dessous : il se lit en haut à droite sans jamais masquer la
// recherche, les notifications ni le compte.
//
// 68 est repris tel quel plutôt que via --kov-topbar-h : ce token vaut
// 68 px en thème clair et 76 px à la racine, et le conteneur de sonner
// est porté dans <body>, hors de la portée claire côté client. Il lirait
// donc 76 et décalerait de 8 px de trop.
const TOPBAR_HEIGHT = 68;
const GAP = 12;

/**
 * Cinq secondes.
 *
 * Les toasts portent désormais un titre ET une description, parfois un
 * bouton. 3,5 s suffisaient pour une phrase seule ; il en faut davantage
 * pour lire deux lignes et décider d'agir. La jauge en bas dit le temps
 * qui reste, et le survol la suspend.
 */
const DURATION_MS = 5000;

// ── LES ICÔNES ───────────────────────────────────────────────────────
//
// La couleur dit le type, mais elle ne le dit pas à tout le monde : la
// forme la double. Une coche, une croix, un point d'exclamation, un « i »
// restent lisibles sans percevoir le vert du rouge.

function Glyph({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span className="kov-toast__glyph" role="img" aria-label={label}>
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

const ICONS = {
  success: (
    <Glyph label="Succès">
      <path d="M20 6 9 17l-5-5" />
    </Glyph>
  ),
  error: (
    <Glyph label="Erreur">
      <path d="M18 6 6 18M6 6l12 12" />
    </Glyph>
  ),
  warning: (
    <Glyph label="Avertissement">
      <path d="M12 7.5v6M12 17.5h.01" />
    </Glyph>
  ),
  info: (
    <Glyph label="Information">
      <path d="M12 11v6M12 7h.01" />
    </Glyph>
  ),
};

export function KovToaster() {
  return (
    <Toaster
      theme="light"
      position="top-right"
      offset={{ top: `${TOPBAR_HEIGHT + GAP}px`, right: "16px" }}
      // Sur téléphone la barre fait toujours 68 px ; seule la marge
      // latérale change, le toast prenant alors toute la largeur.
      mobileOffset={{ top: `${TOPBAR_HEIGHT + GAP}px`, left: "12px", right: "12px" }}
      duration={DURATION_MS}
      closeButton
      // Les cartes sont dépliées en permanence. Empilées en accordéon,
      // elles cacheraient description et bouton — or c'est précisément ce
      // que la maquette demande de montrer. Cela rend aussi la sortie
      // exacte : la position de repos d'un toast déplié est connue, donc
      // il glisse à droite sans sauter (voir kovToast.css).
      expand
      visibleToasts={4}
      gap={12}
      icons={ICONS}
      toastOptions={{
        className: "kov-toast",
        // La durée est recopiée en propriété CSS : la jauge du bas est une
        // animation, et une animation ne peut pas lire la minuterie de
        // sonner autrement.
        style: { "--kov-toast-duration": `${DURATION_MS}ms`, width: "100%" } as CSSProperties,
      }}
      style={
        {
          width: "min(420px, calc(100vw - 24px))",
          // sonner pose 999999999 sur son conteneur. Le site masque le
          // pointeur natif et dessine un point à --z-cursor (70) : à
          // 999999999, le toast passait par-dessus ce point, et le
          // curseur disparaissait dès qu'on le survolait. On ne peut pas
          // cliquer sur ce qu'on ne se voit plus viser.
          zIndex: "var(--z-toast)",
        } as CSSProperties
      }
    />
  );
}
