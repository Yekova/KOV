"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { downloadClientQuotePdf, getClientQuotePdfUrl } from "./actions";

export function QuoteRowActions({ quoteId }: { quoteId: string }) {
  const [isViewing, startViewing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="ghost"
        disabled={isViewing}
        onClick={() => {
          setError(null);
          startViewing(async () => {
            try {
              const url = await getClientQuotePdfUrl(quoteId);
              window.open(url, "_blank", "noopener,noreferrer");
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'aperçu a échoué.");
            }
          });
        }}
      >
        {isViewing ? "Ouverture…" : "Voir →"}
      </Button>
      <form action={downloadClientQuotePdf}>
        <input type="hidden" name="quote_id" value={quoteId} />
        <Button type="submit" variant="ghost">
          Télécharger
        </Button>
      </form>
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </div>
  );
}
