"use client";

import { useState, useTransition } from "react";
import { sendQuoteEmail, downloadQuotePdf } from "./actions";
import { Button } from "@/components/ui/Button";

export function QuoteRowActions({ quoteId, hasEmail }: { quoteId: string; hasEmail: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <form action={downloadQuotePdf}>
        <input type="hidden" name="quote_id" value={quoteId} />
        <Button type="submit" variant="ghost">
          PDF →
        </Button>
      </form>
      <Button
        type="button"
        variant="secondary"
        disabled={isPending || !hasEmail}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await sendQuoteEmail(quoteId);
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'envoi a échoué.");
            }
          });
        }}
      >
        {isPending ? "Envoi…" : sent ? "Envoyé ✓" : "Envoyer par email"}
      </Button>
      {!hasEmail && <span className="text-kov-steel text-xs">Aucun email destinataire</span>}
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </div>
  );
}
