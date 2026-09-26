"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NewLeadForm } from "./NewLeadForm";

export function NewLeadModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        + Nouveau lead
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau lead">
        <NewLeadForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
