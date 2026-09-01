"use client";

import { useState, useTransition, type FormEvent } from "react";
import { createLead } from "./actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_TIMELINES, LEAD_TIMELINE_LABELS } from "@/lib/admin/status";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function NewLeadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const result = await createLead(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        form.reset();
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "La création du lead a échoué.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input name="name" placeholder="Nom" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        <input name="email" type="email" placeholder="Email" required className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        <input name="phone" placeholder="Téléphone (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        <input name="company" placeholder="Entreprise (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        <input name="project_type" placeholder="Type de projet (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        <input name="budget_eur" placeholder="Budget estimé € (facultatif)" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
        <Select
          name="source"
          defaultValue="autre"
          placeholder="Source"
          options={LEAD_SOURCES.map((s) => ({ value: s, label: LEAD_SOURCE_LABELS[s] }))}
          className={FIELD_CLASS}
          style={{ borderColor: "var(--kov-border)" }}
        />
        <Select
          name="timeline"
          defaultValue=""
          placeholder="Délai (facultatif)"
          options={LEAD_TIMELINES.map((t) => ({ value: t, label: LEAD_TIMELINE_LABELS[t] }))}
          className={FIELD_CLASS}
          style={{ borderColor: "var(--kov-border)" }}
        />
      </div>
      <textarea name="message" placeholder="Message (facultatif)" rows={3} className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)" }} />
      {error && <p className="text-kov-red text-xs">{error}</p>}
      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Création…" : "Créer le lead"}
      </Button>
    </form>
  );
}
