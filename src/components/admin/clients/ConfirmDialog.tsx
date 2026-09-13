"use client";

import { GlassCard } from "@/components/ui/GlassCard";

// A real modal, not window.confirm() — the brief for this page explicitly
// asks for one ("Ne jamais exécuter immédiatement"), and window.confirm is
// what the existing client-detail ArchiveClientButton.tsx uses today. Kept
// generic (title/body/confirmLabel) so both archive and restore reuse it.
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
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: "var(--z-modal)" }}
      onClick={onCancel}
    >
      <GlassCard variant="solid" className="w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-kov-bone uppercase text-sm">{title}</p>
        <p className="text-kov-steel text-sm mt-3 leading-relaxed">{body}</p>
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
            style={{ background: "rgba(227,30,36,0.15)", border: "1px solid rgba(227,30,36,0.4)", borderRadius: "var(--radius-sm)" }}
          >
            {pending ? "…" : confirmLabel}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
