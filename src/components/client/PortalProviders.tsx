"use client";

import { Toaster } from "sonner";
import "@/components/ui/kovMotion.css";

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
// En bas à droite plutôt qu'en haut : la barre du haut du portail porte la
// recherche, les notifications et le compte. Un toast qui tombe dessus
// recouvre exactement ce qu'on vient peut-être de vouloir consulter.
export function PortalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        // 3,5 s : assez pour lire une phrase, trop court pour gêner.
        duration={3500}
        // Les icônes de sonner sont colorées par défaut et ne connaissent
        // pas la palette KOV ; le liseré vertical de toastOptions dit la
        // même chose dans la bonne langue.
        toastOptions={{
          className: "kov-toast",
          style: {
            background: "rgba(18,18,18,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "var(--kov-bone)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
          },
        }}
      />
    </>
  );
}
