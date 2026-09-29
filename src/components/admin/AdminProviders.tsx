"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "@/components/ui/kovMotion.css";

// Les fournisseurs client de tout /admin : cache de requêtes et toasts.
//
// Ils vivaient dans /admin/content/QueryProvider.tsx, monté par trois
// layouts de section seulement. Conséquence mesurée : `toast()` est appelé
// dans huit fichiers situés hors de ces trois sections — les actions
// groupées sur les leads, le composeur d'emails, la liste d'emails et les
// quatre gestionnaires de /admin/settings — et n'affichait rien du tout.
// Mettre douze leads à jour ne donnait aucune confirmation.
//
// Un seul <Toaster/> dans l'application, à la racine de l'admin : sonner
// rend une liste par Toaster, donc deux montages afficheraient chaque
// message en double. C'est pourquoi les trois layouts de section ont été
// supprimés en même temps que ce fichier est né, et non laissés en place.
//
// Effet de bord voulu : le QueryClient devient partagé entre les sections,
// donc le cache survit à une navigation contenu → réalisations au lieu
// d'être jeté. Avec staleTime à 0, cela remplace « spinner puis données »
// par « données d'hier puis données fraîches ».
export function AdminProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        theme="dark"
        // En bas à droite, comme le portail : la barre du haut de l'admin
        // porte la recherche, les notifications et le compte. Un toast qui
        // tombe dessus recouvre exactement ce qu'on vient de vouloir
        // consulter. Les deux espaces parlent maintenant au même endroit.
        position="bottom-right"
        // 3,5 s : assez pour lire une phrase, trop court pour gêner.
        duration={3500}
        toastOptions={{
          // La classe manquait : les toasts de l'admin n'avaient donc PAS
          // le liseré vertical coloré qui dit succès, erreur ou
          // avertissement. Ils étaient gris, tous pareils, et il fallait
          // lire la phrase entière pour savoir si l'action avait abouti.
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
    </QueryClientProvider>
  );
}
