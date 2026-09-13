"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { downloadClientQuotePdf, getClientQuotePdfUrl } from "./actions";

export function QuoteRowActions({
  quoteId,
  signingUrl,
  signedAt,
}: {
  quoteId: string;
  signingUrl: string | null;
  signedAt: string | null;
}) {
  const [isViewing, startViewing] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      {signedAt ? (
        <span className="text-[#3FB27F] text-xs uppercase tracking-widest">
          Signé le {new Date(signedAt).toLocaleDateString("fr-FR")}
        </span>
      ) : (
        signingUrl && (
          // A real Yousign signing link, not a placeholder — opens
          // Yousign's own eIDAS-compliant signing flow in a new tab.
          <a
            href={signingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors"
          >
            Signer le devis →
          </a>
        )
      )}
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
