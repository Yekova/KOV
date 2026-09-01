"use client";

import { Select } from "@/components/ui/Select";
import type { ComposerSignature } from "@/app/admin/emails/actions";

export function EmailSignaturePicker({
  signatures,
  selectedId,
  onChange,
}: {
  signatures: ComposerSignature[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  if (signatures.length === 0) {
    return <p className="text-kov-steel text-xs">Aucune signature enregistrée — configurable depuis les paramètres.</p>;
  }

  return (
    <Select
      value={selectedId ?? ""}
      onChange={(v) => onChange(v || null)}
      placeholder="— Aucune signature —"
      options={signatures.map((s) => ({ value: s.id, label: s.isDefault ? `${s.name} (par défaut)` : s.name }))}
      className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none w-full"
      style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
    />
  );
}
