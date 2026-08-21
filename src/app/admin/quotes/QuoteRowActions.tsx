"use client";

import { useState, useTransition } from "react";
import { sendQuoteEmail, downloadQuotePdf, getQuotePdfUrl } from "./actions";
import { Button } from "@/components/ui/Button";

export function QuoteRowActions({ quoteId, hasEmail }: { quoteId: string; hasEmail: boolean }) {
  const [isSending, startSending] = useTransition();
  const [isViewing, startViewing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

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
              const url = await getQuotePdfUrl(quoteId);
              window.open(url, "_blank", "noopener,noreferrer");
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'aperçu a échoué.");
            }
          });
        }}
      >
        {isViewing ? "Ouverture…" : "Voir →"}
      </Button>
      <form action={downloadQuotePdf}>
        <input type="hidden" name="quote_id" value={quoteId} />
        <Button type="submit" variant="ghost">
          Télécharger
        </Button>
      </form>
      <Button
        type="button"
        variant="secondary"
        disabled={isSending || !hasEmail}
        onClick={() => {
          setError(null);
          startSending(async () => {
            try {
              await sendQuoteEmail(quoteId);
              setSent(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : "L'envoi a échoué.");
            }
          });
        }}
      >
        {isSending ? "Envoi…" : sent ? "Envoyé ✓" : "Envoyer par email"}
      </Button>
      {!hasEmail && <span className="text-kov-steel text-xs">Aucun email destinataire</span>}
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </div>
  );
}
