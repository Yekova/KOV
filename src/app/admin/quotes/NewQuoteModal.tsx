"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { NewQuoteForm } from "./NewQuoteForm";

export function NewQuoteModal({
  clients,
  leads,
}: {
  clients: { id: string; label: string }[];
  leads: { id: string; label: string; email: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        + Nouveau devis
      </Button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 flex items-start justify-center px-4 py-10 overflow-y-auto"
            style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
            onClick={() => setOpen(false)}
          >
            <GlassCard variant="solid" className="w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-display text-kov-bone text-lg uppercase">Nouveau devis</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="text-kov-steel hover:text-kov-red transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <NewQuoteForm clients={clients} leads={leads} onSuccess={() => setOpen(false)} />
            </GlassCard>
          </div>,
          document.body
        )}
    </>
  );
}
