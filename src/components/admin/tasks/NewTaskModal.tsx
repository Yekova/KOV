"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import { createTask } from "@/app/admin/projects/actions";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/admin/status";
import type { PickerOption } from "./types";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function NewTaskModal({
  projects,
  admins,
  phasesByProject,
  fixedProjectId,
}: {
  projects: PickerOption[];
  admins: PickerOption[];
  phasesByProject: Record<string, PickerOption[]>;
  /** Pre-selects and hides the project field — for the project detail page's
   * own Tasks tab, where the project is already fixed by context. */
  fixedProjectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(fixedProjectId ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const phaseOptions = phasesByProject[projectId] ?? [];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createTask(formData);
        setOpen(false);
        setProjectId(fixedProjectId ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "La création a échoué.");
      }
    });
  }

  return (
    <>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        + Nouvelle tâche
      </Button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 flex items-center justify-center px-4"
            style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
            onClick={() => setOpen(false)}
          >
            <GlassCard variant="solid" className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="font-display text-kov-bone text-lg uppercase mb-2">Nouvelle tâche</p>

                {fixedProjectId ? (
                  <input type="hidden" name="project_id" value={fixedProjectId} />
                ) : (
                  <Select
                    name="project_id"
                    defaultValue=""
                    placeholder="Choisir un projet…"
                    options={projects.map((p) => ({ value: p.id, label: p.label }))}
                    onChange={setProjectId}
                    className={FIELD_CLASS}
                    style={{ borderColor: "var(--kov-border)" }}
                  />
                )}
                <input name="title" placeholder="Titre de la tâche" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <textarea name="description" placeholder="Description (facultatif)" rows={2} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                <Select
                  name="phase_id"
                  defaultValue=""
                  placeholder={projectId ? "Phase (facultatif)" : "Choisissez un projet d'abord"}
                  disabled={!projectId}
                  options={phaseOptions.map((p) => ({ value: p.id, label: p.label }))}
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
                <Select
                  name="assigned_to"
                  defaultValue=""
                  placeholder="Assigné à (facultatif)"
                  options={admins.map((a) => ({ value: a.id, label: a.label }))}
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
                <Select
                  name="priority"
                  defaultValue=""
                  placeholder="Priorité (facultatif)"
                  options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
                  className={FIELD_CLASS}
                  style={{ borderColor: "var(--kov-border)" }}
                />
                <input name="due_date" type="date" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
                {error && <p className="text-kov-red text-xs">{error}</p>}
                <Button type="submit" variant="primary" className="w-full justify-center" disabled={isPending}>
                  {isPending ? "Création…" : "Créer la tâche"}
                </Button>
              </form>
            </GlassCard>
          </div>,
          document.body
        )}
    </>
  );
}
