"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NewInvoiceForm } from "./NewInvoiceForm";

export function NewInvoiceModal({ clients }: { clients: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        + Nouvelle facture
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle facture" size="lg" closeOnBackdrop={false}>
        <NewInvoiceForm clients={clients} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
