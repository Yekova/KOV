"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { uploadClientDocument } from "./actions";

const FIELD_CLASS =
  "block bg-transparent border px-3 py-2 mt-1 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export function UploadDocumentForm({ projects }: { projects: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await uploadClientDocument(formData);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "L'envoi a échoué.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      {projects.length > 0 && (
        <label className="text-xs text-kov-steel">
          Projet (facultatif)
          <select name="project_id" defaultValue="" className={FIELD_CLASS} style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
            <option value="">Général</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="text-xs text-kov-steel">
        Fichier
        <input
          type="file"
          name="file"
          required
          className="block text-kov-bone text-sm mt-1 file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:uppercase file:tracking-widest file:bg-kov-red file:text-white"
        />
      </label>
      <Button type="submit" variant="primary" disabled={isPending}>
        {isPending ? "Envoi…" : "Envoyer"}
      </Button>
      {error && <p className="text-kov-red text-sm w-full">{error}</p>}
    </form>
  );
}
