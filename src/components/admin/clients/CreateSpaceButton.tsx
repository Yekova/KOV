"use client";

import { useState } from "react";
import { ClientSpaceWizard } from "./ClientSpaceWizard";

// Le bouton qui ouvre l'assistant.
//
// Séparé de la page pour une seule raison : la page des clients est un
// composant serveur, et l'assistant a besoin d'un état ouvert/fermé. Ce
// fichier ne fait que porter cet état.
export function CreateSpaceButton({ admins }: { admins: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="kov-rise text-kov-white inline-flex h-10 items-center gap-2 px-5 text-xs tracking-widest uppercase transition-colors"
        style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
      >
        <span className="relative z-10">Créer un espace client</span>
      </button>

      <ClientSpaceWizard open={open} onClose={() => setOpen(false)} admins={admins} />
    </>
  );
}
