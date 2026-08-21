"use client";

import { useState, useTransition } from "react";
import { archiveClient, unarchiveClient } from "../actions";

export function ArchiveClientButton({ clientId, isArchived }: { clientId: string; isArchived: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const message = isArchived
            ? "Réactiver ce client ? Il réapparaîtra dans la liste par défaut."
            : "Archiver ce client ? Il n'apparaîtra plus dans la liste par défaut, mais rien n'est supprimé.";
          if (!window.confirm(message)) return;
          setError(null);
          startTransition(async () => {
            try {
              await (isArchived ? unarchiveClient(clientId) : archiveClient(clientId));
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'action a échoué.");
            }
          });
        }}
        className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
      >
        {isPending ? "…" : isArchived ? "Réactiver le client" : "Archiver le client"}
      </button>
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </span>
  );
}
