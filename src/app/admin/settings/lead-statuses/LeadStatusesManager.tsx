"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { createLeadStatus, updateLeadStatus, setLeadStatusActive, reorderLeadStatuses } from "./actions";
import type { LeadStatusRow } from "@/lib/leads/statuses";

const FIELD_CLASS =
  "bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function LeadStatusesManager({ statuses }: { statuses: LeadStatusRow[] }) {
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#7C7C7A");
  const [isPending, startTransition] = useTransition();

  const ordered = [...statuses].sort((a, b) => a.position - b.position);
  const orderedKeys = ordered.map((s) => s.key);

  function handleCreate() {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("label", newLabel);
      formData.set("color", newColor);
      const result = await createLeadStatus(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Statut créé");
      setNewLabel("");
      setNewColor("#7C7C7A");
    });
  }

  function handleReorder(key: string, currentIndex: number, direction: -1 | 1) {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= orderedKeys.length) return;
    const next = [...orderedKeys];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    startTransition(async () => {
      const result = await reorderLeadStatuses(next);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3">
      {ordered.map((status, index) => (
        <StatusRow key={status.key} status={status} index={index} total={ordered.length} onMove={handleReorder} />
      ))}

      <div
        className="flex flex-wrap items-center gap-3 p-4"
        style={{ border: "1px dashed var(--kov-border)", borderRadius: "var(--radius-md)" }}
      >
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-9 h-9 shrink-0 bg-transparent border cursor-pointer"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          aria-label="Couleur du nouveau statut"
        />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nom du nouveau statut…"
          className={`${FIELD_CLASS} flex-1 min-w-[160px]`}
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
        <Button type="button" variant="primary" disabled={isPending || !newLabel.trim()} onClick={handleCreate} className="shrink-0">
          <Plus size={14} /> Ajouter
        </Button>
      </div>
    </div>
  );
}

// Thin wrapper so each row's up/down buttons call back into the parent's
// full-list reorder instead of each row trying to own ordering logic itself.
function StatusRow({
  status,
  index,
  total,
  onMove,
}: {
  status: LeadStatusRow;
  index: number;
  total: number;
  onMove: (key: string, index: number, direction: -1 | 1) => void;
}) {
  const [label, setLabel] = useState(status.label);
  const [color, setColor] = useState(status.color);
  const [isPending, startTransition] = useTransition();

  const dirty = label !== status.label || color !== status.color;

  function handleSave() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("label", label);
      formData.set("color", color);
      const result = await updateLeadStatus(status.key, formData);
      if (result.error) toast.error(result.error);
      else toast.success("Statut mis à jour");
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      const result = await setLeadStatusActive(status.key, !status.isActive);
      if (result.error) toast.error(result.error);
      else toast.success(status.isActive ? "Statut désactivé" : "Statut réactivé");
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 p-4"
      style={{ background: "var(--kov-carbon)", border: "1px solid var(--kov-border)", borderRadius: "var(--radius-md)" }}
    >
      <div className="flex flex-col shrink-0">
        <button type="button" disabled={index === 0} onClick={() => onMove(status.key, index, -1)} className="text-kov-steel hover:text-kov-red disabled:opacity-30 transition-colors" aria-label="Monter">
          <ArrowUp size={13} />
        </button>
        <button type="button" disabled={index === total - 1} onClick={() => onMove(status.key, index, 1)} className="text-kov-steel hover:text-kov-red disabled:opacity-30 transition-colors" aria-label="Descendre">
          <ArrowDown size={13} />
        </button>
      </div>

      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-9 h-9 shrink-0 bg-transparent border cursor-pointer"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        aria-label="Couleur"
      />

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className={`${FIELD_CLASS} flex-1 min-w-[160px]`}
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      />

      {status.isProtected && (
        <span className="inline-flex items-center gap-1 text-kov-steel text-[10px] uppercase tracking-widest shrink-0">
          <Lock size={11} /> Protégé
        </span>
      )}

      {dirty && (
        <Button type="button" variant="secondary" disabled={isPending} onClick={handleSave} className="shrink-0">
          Enregistrer
        </Button>
      )}

      <button
        type="button"
        disabled={isPending || (status.isProtected && status.isActive)}
        onClick={handleToggleActive}
        title={status.isProtected && status.isActive ? "Ce statut est protégé et ne peut pas être désactivé." : undefined}
        className="text-xs uppercase tracking-widest shrink-0 disabled:opacity-30 transition-colors"
        style={{ color: status.isActive ? "var(--kov-steel)" : "var(--kov-red)" }}
      >
        {status.isActive ? "Désactiver" : "Réactiver"}
      </button>
    </div>
  );
}
