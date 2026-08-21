"use client";

import { useState, useTransition } from "react";
import { deleteDocument } from "../actions";

export function DeleteDocumentButton({ documentId, filename }: { documentId: string; filename: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Supprimer définitivement « ${filename} » ?`)) return;
          setError(null);
          startTransition(async () => {
            try {
              await deleteDocument(documentId);
            } catch (err) {
              setError(err instanceof Error ? err.message : "La suppression a échoué.");
            }
          });
        }}
        className="text-kov-steel hover:text-kov-red transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
      >
        {isPending ? "Suppression…" : "Supprimer"}
      </button>
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </span>
  );
}
