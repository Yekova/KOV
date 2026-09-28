"use client";

import { useRef } from "react";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
import { createRequestThread } from "./actions";

const FIELD_CLASS =
  "kov-field w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-concrete/70 text-sm focus:outline-none";

export function NewRequestForm({ projects }: { projects: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = useKovAction({
    success: "Demande envoyée. Le studio vous répond ici.",
    fallbackError: "L'envoi a échoué.",
  });

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        action.run(async () => {
          await createRequestThread(formData);
          // Vidé seulement après un envoi réussi : un échec doit rendre le
          // texte, pas le faire disparaître.
          formRef.current?.reset();
        });
      }}
      className="space-y-4"
    >
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
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
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
      <div className="flex flex-wrap items-center gap-4">
        <KovActionButton state={action.state} onStateSettled={action.reset}>
          Envoyer
        </KovActionButton>
        {/* Le toast dit déjà l'erreur ; celle-ci reste à côté du champ,
            parce qu'un toast disparaît et qu'on relit son formulaire. */}
        {action.error && (
          <p role="alert" className="text-sm" style={{ color: "var(--kov-red)" }}>
            {action.error}
          </p>
        )}
      </div>
    </form>
  );
}
