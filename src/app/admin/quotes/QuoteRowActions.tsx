"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { sendQuoteEmail, downloadQuotePdf, getQuotePdfUrl, deleteQuote, convertQuoteToInvoice, linkQuoteToClient } from "./actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { InvoiceKindFields } from "@/components/admin/invoices/InvoiceKindFields";

const FIELD_CLASS = "bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

// A devis reference like "D-2026-01" suggests "F-2026-01" for the invoice —
// just a starting point in the input, not enforced; anything else typed by
// the admin is used as-is.
function suggestInvoiceReference(quoteReference: string) {
  return quoteReference.startsWith("D-") ? `F-${quoteReference.slice(2)}` : "";
}

function ConvertToInvoiceForm({ quoteId, reference, totalCents, onDone }: { quoteId: string; reference: string; totalCents: number; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await convertQuoteToInvoice(quoteId, formData);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "La conversion a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="w-full border p-4 mt-3 flex flex-wrap items-end gap-4" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}>
      <label className="text-xs text-kov-steel">
        Référence facture
        <input
          type="text"
          name="reference"
          required
          defaultValue={suggestInvoiceReference(reference)}
          placeholder="F-2026-01"
          className={FIELD_CLASS}
          style={{ borderColor: "var(--kov-border)" }}
        />
      </label>
      <label className="text-xs text-kov-steel">
        Montant (€)
        <input type="text" name="amount_eur" required defaultValue={(totalCents / 100).toFixed(2)} className={`${FIELD_CLASS} w-32`} style={{ borderColor: "var(--kov-border)" }} />
      </label>
      <label className="text-xs text-kov-steel">
        Échéance
        <input type="date" name="due_at" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
      </label>
      <InvoiceKindFields />
      {error && <p className="text-kov-red text-xs w-full">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Création…" : "Créer la facture"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={isPending}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function LinkClientInline({ quoteId, clients }: { quoteId: string; clients: { id: string; label: string }[] }) {
  const [clientId, setClientId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={clientId}
        onChange={setClientId}
        placeholder="Lier un client…"
        options={clients.map((c) => ({ value: c.id, label: c.label }))}
        className="bg-transparent border text-kov-bone text-xs px-3 py-2 focus:outline-none disabled:opacity-50 w-44"
        style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
        disabled={isPending}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={isPending || !clientId}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await linkQuoteToClient(quoteId, clientId);
            } catch (err) {
              setError(err instanceof Error ? err.message : "La liaison a échoué.");
            }
          });
        }}
      >
        {isPending ? "…" : "Lier"}
      </Button>
      {error && <span className="text-kov-red text-xs">{error}</span>}
    </div>
  );
}

export function QuoteRowActions({
  quoteId,
  hasEmail,
  status,
  reference,
  clientId,
  totalCents,
  invoiceId,
  clients,
}: {
  quoteId: string;
  hasEmail: boolean;
  status: string;
  reference: string;
  clientId: string | null;
  totalCents: number;
  invoiceId: string | null;
  clients: { id: string; label: string }[];
}) {
  const [isSending, startSending] = useTransition();
  const [isViewing, startViewing] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [converting, setConverting] = useState(false);

  return (
    <div className="w-full flex flex-wrap items-center gap-3">
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

      {status === "accepted" ? (
        invoiceId ? (
          clientId && (
            <Link href={`/admin/clients/${clientId}`} className="text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors">
              → Facture créée
            </Link>
          )
        ) : clientId ? (
          <Button type="button" variant="secondary" onClick={() => setConverting((v) => !v)}>
            {converting ? "Annuler la conversion" : "Convertir en facture"}
          </Button>
        ) : (
          <LinkClientInline quoteId={quoteId} clients={clients} />
        )
      ) : (
        <span className="text-kov-steel text-xs">Passez ce devis en « Accepté » pour pouvoir le facturer</span>
      )}

      {status !== "accepted" && (
        <Button
          type="button"
          variant="ghost"
          disabled={isDeleting}
          onClick={() => {
            if (!window.confirm(`Supprimer définitivement le devis ${reference} ?`)) return;
            setError(null);
            startDeleting(async () => {
              try {
                await deleteQuote(quoteId);
              } catch (err) {
                setError(err instanceof Error ? err.message : "La suppression a échoué.");
              }
            });
          }}
        >
          <span className="text-kov-red">{isDeleting ? "Suppression…" : "Supprimer"}</span>
        </Button>
      )}
      {!hasEmail && <span className="text-kov-steel text-xs">Aucun email destinataire</span>}
      {error && <span className="text-kov-red text-xs">{error}</span>}

      {converting && clientId && (
        <ConvertToInvoiceForm quoteId={quoteId} reference={reference} totalCents={totalCents} onDone={() => setConverting(false)} />
      )}
    </div>
  );
}
