"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { createRequestThread } from "./actions";

const FIELD_CLASS =
  "w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-steel text-sm focus:outline-none focus:border-kov-red transition-colors";

export function NewRequestForm({ projects }: { projects: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createRequestThread(formData);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'envoi a échoué.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="subject"
        required
        placeholder="Sujet"
        className={FIELD_CLASS}
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      />
      {projects.length > 0 && (
        <select
          name="project_id"
          defaultValue=""
          className={FIELD_CLASS}
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          <option value="">Projet concerné (facultatif)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Votre message…"
        className={FIELD_CLASS}
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      />
      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Envoi…" : "Envoyer"}
        </Button>
        {error && <p className="text-kov-red text-sm">{error}</p>}
      </div>
    </form>
  );
}
