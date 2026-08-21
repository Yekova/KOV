"use client";

import { useState, useTransition } from "react";
import { deactivateAdmin, reactivateAdmin } from "./actions";

export function DeactivateAdminButton({ adminId, isArchived }: { adminId: string; isArchived: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const message = isArchived
            ? "Réactiver ce compte ? L'accès à l'espace admin sera restauré."
            : "Désactiver ce compte ? L'accès à l'espace admin sera immédiatement coupé.";
          if (!window.confirm(message)) return;
          setError(null);
          startTransition(async () => {
            try {
              await (isArchived ? reactivateAdmin(adminId) : deactivateAdmin(adminId));
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'action a échoué.");
            }
          });
        }}
        className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {isPending ? "…" : isArchived ? "Réactiver" : "Désactiver"}
      </button>
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </span>
  );
}
