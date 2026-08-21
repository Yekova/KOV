"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ClientPortalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // See src/app/admin/error.tsx for why this specific case needs a real
  // reload instead of a retry — a redeploy rotates Server Action IDs.
  const isStaleAction = error.message?.includes("Failed to find Server Action");

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-kov-red text-xs uppercase tracking-widest mb-3">Erreur</p>
        <h1 className="font-display text-kov-bone text-xl uppercase mb-3">Une action a échoué</h1>
        <p className="text-kov-steel text-sm mb-8">
          {isStaleAction
            ? "Le site vient d'être mis à jour — rechargez la page pour continuer."
            : error.message || "Une erreur inattendue s'est produite. Vos données précédentes n'ont pas été perdues."}
        </p>
        <div className="flex items-center justify-center gap-4">
          {isStaleAction ? (
            <Button type="button" variant="primary" onClick={() => window.location.reload()}>
              Recharger
            </Button>
          ) : (
            <Button type="button" variant="primary" onClick={retry}>
              Réessayer
            </Button>
          )}
          <Button href="/client" variant="secondary">
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    </main>
  );
}
