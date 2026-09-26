"use client";

import { Modal } from "@/components/ui/Modal";

// Une vraie modale de confirmation, pas window.confirm().
//
// Reconstruite sur le primitif Modal sans changer un seul de ses props :
// les appels existants ne bougent pas, et elle gagne au passage le piège de
// focus, Échap, la restitution du focus et l'arrêt du défilement derrière,
// qu'elle n'avait pas.
//
// Fermeture au clic extérieur volontairement désactivée : une boîte de
// confirmation existe pour qu'un geste soit délibéré, et se refermer sur un
// clic à côté est exactement le contraire.
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm" closeOnBackdrop={false}>
      <p className="text-kov-steel text-sm leading-relaxed">{body}</p>
      {error && <p className="text-kov-red text-xs mt-3">{error}</p>}
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-kov-steel hover:text-kov-bone text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="px-4 py-2 text-xs uppercase tracking-widest text-kov-bone transition-colors disabled:opacity-50"
          style={{
            background: "rgba(227,30,36,0.15)",
            border: "1px solid rgba(227,30,36,0.4)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {pending ? "…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
