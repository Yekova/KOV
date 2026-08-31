"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createPhase, renamePhase, updatePhaseStatus, deletePhase, addDefaultPhases } from "@/app/admin/projects/[id]/actions";
import { PROJECT_PHASE_STATUSES, PROJECT_PHASE_STATUS_LABELS, KOV_DEFAULT_PHASES } from "@/lib/admin/status";

type Phase = { id: string; name: string; status: string };

export function ProjectPhasesPanel({ projectId, phases }: { projectId: string; phases: Phase[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'action a échoué.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-kov-red text-xs">{error}</p>}

      {phases.length === 0 ? (
        <p className="text-kov-steel text-sm">Aucune phase pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {phases.map((phase) => (
            <li
              key={phase.id}
              className="flex flex-wrap items-center gap-3 border-b py-3"
              style={{ borderColor: "var(--kov-border)" }}
            >
              <input
                defaultValue={phase.name}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value.trim() !== phase.name) {
                    run(() => renamePhase(phase.id, projectId, e.target.value));
                  }
                }}
                disabled={isPending}
                className="flex-1 min-w-[160px] bg-transparent border-none text-kov-bone text-sm focus:outline-none disabled:opacity-50"
              />
              <Select
                value={phase.status}
                disabled={isPending}
                onChange={(value) => run(() => updatePhaseStatus(phase.id, projectId, value))}
                options={PROJECT_PHASE_STATUSES.map((s) => ({ value: s, label: PROJECT_PHASE_STATUS_LABELS[s] }))}
                className="bg-transparent border px-3 py-1.5 text-kov-bone text-xs uppercase tracking-widest focus:outline-none disabled:opacity-50"
                style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--kov-border)" }}
              />
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (window.confirm(`Supprimer la phase « ${phase.name} » ?`)) run(() => deletePhase(phase.id, projectId));
                }}
                className="text-kov-steel hover:text-kov-red text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              e.preventDefault();
              run(() => createPhase(projectId, newName));
              setNewName("");
            }
          }}
          placeholder="Nouvelle phase…"
          disabled={isPending}
          className="bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={isPending || !newName.trim()}
          onClick={() => {
            run(() => createPhase(projectId, newName));
            setNewName("");
          }}
        >
          Ajouter
        </Button>
        {phases.length === 0 && (
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => run(() => addDefaultPhases(projectId, KOV_DEFAULT_PHASES))}>
            Ajouter les phases KOV
          </Button>
        )}
      </div>
    </div>
  );
}
