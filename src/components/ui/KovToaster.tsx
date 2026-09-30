"use client";

import { Toaster } from "sonner";
import "./kovMotion.css";

// La notification KOV, définie une seule fois.
//
// L'admin et le portail montaient chacun leur <Toaster/> avec leurs
// propres réglages recopiés — et les deux avaient déjà divergé d'un
// centième d'opacité sur la bordure. Un seul composant, deux montages :
// sonner rend une liste par Toaster, et /admin et /client sont deux
// arbres de routes qui ne coexistent jamais.
//
// ── EN HAUT À DROITE, MAIS SOUS LA BARRE ─────────────────────────────
//
// Les toasts étaient en bas à droite pour une raison écrite noir sur
// blanc dans les deux fichiers : la barre du haut porte la recherche, les
// notifications et le compte, et un toast posé dessus recouvre exactement
// ce qu'on vient de vouloir consulter.
//
// Le décalage règle ce problème plutôt que de le réintroduire : les deux
// barres mesurent 68 px (valeur écrite en dur dans AdminTopNavigation et
// PortalTopNavigation), et le toast commence 12 px en dessous. Il se lit
// donc en haut à droite, sans jamais masquer la barre.
//
// 68 est repris ici tel quel plutôt que par --kov-topbar-h : ce token vaut
// 68 px en thème clair et 76 px à la racine, et le conteneur de sonner est
// porté dans <body>, hors de la portée claire côté client. Il lirait donc
// 76 et décalerait de 8 px de trop.
const TOPBAR_HEIGHT = 68;
const GAP = 12;

/** 3,5 s : assez pour lire une phrase, trop court pour gêner. */
const DURATION_MS = 3500;

// ── POURQUOI DES ICÔNES, ET PAS SEULEMENT LA COULEUR ─────────────────
//
// Le fond est désormais le rouge de la marque pour TOUS les messages. La
// couleur ne distingue donc plus un succès d'un échec — alors qu'il y a
// 113 appels à toast.error et 74 à toast.success dans l'application.
//
// La forme prend le relais : une coche, une croix, un point
// d'exclamation. C'est lisible sans percevoir les couleurs, ce qui vaut
// mieux que ce qu'il y avait avant.

function Glyph({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span className="kov-toast__glyph" role="img" aria-label={label}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
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
      <path d="M12 8v5M12 17h.01" />
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
      theme="dark"
      position="top-right"
      offset={{ top: `${TOPBAR_HEIGHT + GAP}px`, right: "16px" }}
      // Sur téléphone la barre reste haute de 68 px, mais le toast
      // occupe toute la largeur : seule la marge latérale change.
      mobileOffset={{ top: `${TOPBAR_HEIGHT + GAP}px`, left: "12px", right: "12px" }}
      duration={DURATION_MS}
      icons={ICONS}
      toastOptions={{
        className: "kov-toast",
        style: {
          // Le fond est dans la feuille de style, pas ici : il varie selon
          // le type du message, ce qu'un style en ligne ne sait pas faire.
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          // Blanc pur et non --kov-bone : mesuré sur le rouge de marque
          // (#e31e24), le bone tombe à 3,79:1 et le blanc tient 4,69:1.
          // Le dégradé ne s'éclaircissant jamais vers la droite, 4,69 est
          // le pire cas de tout le toast.
          color: "var(--kov-white)",
          borderRadius: "var(--radius-md)",
          fontSize: "13px",
        },
      }}
    />
  );
}
