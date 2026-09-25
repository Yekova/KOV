"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

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
        toastOptions={{
          style: {
            background: "var(--kov-graphite)",
            border: "1px solid var(--kov-border)",
            color: "var(--kov-bone)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
