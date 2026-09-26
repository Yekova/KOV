"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { FIELD_CLASS, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { createProject } from "@/app/admin/clients/actions";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/admin/status";

export type PickerOption = { id: string; label: string };

// Le formulaire de création d'un projet, extrait pour de bon.
//
// Il existait en deux exemplaires : ici, et dans QuickActionMenu. Le
// commentaire de CreateProjectModal l'assumait même explicitement — « same
// fields, duplicated locally ». Le même choix avait été fait pour le lead,
// et les deux copies avaient déjà divergé : celle du menu d'action rapide
// avait perdu le champ « délai ».
//
// Une copie qui diverge est le cas normal, pas l'accident. Un formulaire,
// un fichier.
export function ProjectForm({
  clients,
  admins,
  onSuccess,
}: {
  clients: PickerOption[];
  admins: PickerOption[];
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createProject(formData);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'action a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        name="client_id"
        defaultValue=""
        placeholder="Choisir un client…"
        options={clients.map((c) => ({ value: c.id, label: c.label }))}
        className={FIELD_CLASS}
        style={FIELD_STYLE}
      />
      <input name="name" placeholder="Nom du projet" required className={FIELD_CLASS} style={FIELD_STYLE} />
      <input name="category" placeholder="Catégorie" required className={FIELD_CLASS} style={FIELD_STYLE} />
      <Select
        name="project_manager_id"
        defaultValue=""
        placeholder="Chef de projet (facultatif)"
        options={admins.map((a) => ({ value: a.id, label: a.label }))}
        className={FIELD_CLASS}
        style={FIELD_STYLE}
      />
      <input name="budget_eur" placeholder="Budget € (facultatif)" className={FIELD_CLASS} style={FIELD_STYLE} />
      <Select
        name="priority"
        defaultValue=""
        placeholder="Priorité (facultatif)"
        options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
        className={FIELD_CLASS}
        style={FIELD_STYLE}
      />
      {error && <p className="text-kov-red text-xs">{error}</p>}
      <Button type="submit" variant="primary" className="w-full justify-center" disabled={isPending}>
        {isPending ? "Création…" : "Créer le projet"}
      </Button>
    </form>
  );
}
