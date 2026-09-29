"use client";

import { type FormEvent } from "react";
import { createLead } from "./actions";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
import { Select } from "@/components/ui/Select";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_TIMELINES, LEAD_TIMELINE_LABELS } from "@/lib/admin/status";

const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function NewLeadForm({ onSuccess }: { onSuccess?: () => void }) {
  const action = useKovAction({
    success: "Lead créé.",
    fallbackError: "La création du lead a échoué.",
    onSuccess,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    action.run(async () => {
      // createLead RENVOIE son erreur au lieu de la lever : il faut la
      // relever ici pour que le cycle passe en « erreur » au lieu de
      // conclure à un succès silencieux.
      const result = await createLead(formData);
      if (result.error) throw new Error(result.error);
      form.reset();
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
      {action.error && (
        <p role="alert" className="text-kov-red text-xs">
          {action.error}
        </p>
      )}
      <KovActionButton state={action.state} onStateSettled={action.reset} successLabel="Créé">
        Créer le lead
      </KovActionButton>
    </form>
  );
}
