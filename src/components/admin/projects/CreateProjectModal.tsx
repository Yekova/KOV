"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Select } from "@/components/ui/Select";
import { createProject } from "@/app/admin/clients/actions";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/admin/status";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

type PickerOption = { id: string; label: string };

// Same real createProject server action + form fields as
// QuickActionMenu.tsx's "Nouveau projet" modal (the topbar's "+ Nouvelle
// action" menu) — duplicated locally rather than exposing an "open
// externally" API on that shared, sitewide component, so this page-scoped
// button doesn't touch anything used outside /admin/projects.
export function CreateProjectModal({ clients, admins, onClose }: { clients: PickerOption[]; admins: PickerOption[]; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createProject(formData);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'action a échoué.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: "var(--z-modal)", background: "rgba(10,10,10,0.7)" }}
      onClick={onClose}
    >
      <GlassCard variant="solid" className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="font-display text-kov-bone text-lg uppercase mb-2">Nouveau projet</p>
          <Select
            name="client_id"
            defaultValue=""
            placeholder="Choisir un client…"
            options={clients.map((c) => ({ value: c.id, label: c.label }))}
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)" }}
          />
          <input name="name" placeholder="Nom du projet" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          <input name="category" placeholder="Catégorie" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          <Select
            name="project_manager_id"
            defaultValue=""
            placeholder="Chef de projet (facultatif)"
            options={admins.map((a) => ({ value: a.id, label: a.label }))}
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)" }}
          />
          <input name="budget_eur" placeholder="Budget € (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
          <Select
            name="priority"
            defaultValue=""
            placeholder="Priorité (facultatif)"
            options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)" }}
          />
          {error && <p className="text-kov-red text-xs">{error}</p>}
          <Button type="submit" variant="primary" className="w-full justify-center" disabled={isPending}>
            {isPending ? "Création…" : "Créer le projet"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
