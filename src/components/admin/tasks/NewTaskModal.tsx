"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { FIELD_CLASS } from "@/components/ui/fieldStyles";
import { createTask } from "@/app/admin/projects/actions";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/admin/status";
import type { PickerOption } from "./types";

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
        const result = await createTask(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
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

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle tâche" size="sm" closeOnBackdrop={false}>
              <form onSubmit={handleSubmit} className="space-y-4">
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
      </Modal>
    </>
  );
}
