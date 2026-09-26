"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NewQuoteForm } from "./NewQuoteForm";

export function NewQuoteModal({
  clients,
  leads,
  projects,
}: {
  clients: { id: string; label: string; email: string }[];
  leads: { id: string; label: string; email: string }[];
  projects: { id: string; label: string; clientId: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        + Nouveau devis
      </Button>

      {/* Pas de fermeture au clic extérieur : un devis se remplit sur
          plusieurs lignes, et le perdre d'un clic à côté coûte cher. */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau devis" size="lg" closeOnBackdrop={false}>
        <NewQuoteForm clients={clients} leads={leads} projects={projects} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
