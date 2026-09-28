"use client";

import { useRef, useState } from "react";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { useKovAction } from "@/lib/useKovAction";
import { uploadClientDocument } from "./actions";

const FIELD_CLASS = "kov-field block bg-transparent border px-3 py-2 mt-1 text-kov-bone text-sm focus:outline-none";

/** Ce que l'action serveur refuse au-delà (voir assertUploadable). */
const MAX_BYTES = 25 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

export function UploadDocumentForm({ projects }: { projects: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const action = useKovAction({
    success: "Document envoyé.",
    fallbackError: "L'envoi a échoué.",
    onSuccess: () => setFile(null),
  });

  // La limite est vérifiée ici AUSSI, pas seulement côté serveur : refuser
  // un fichier de 40 Mo après l'avoir téléversé fait perdre le téléversement
  // et le temps qu'il a pris. Le serveur reste l'autorité — ceci évite
  // seulement un aller-retour dont on connaît déjà l'issue.
  const tooLarge = file !== null && file.size > MAX_BYTES;

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        if (tooLarge) return;
        const formData = new FormData(event.currentTarget);
        action.run(async () => {
          await uploadClientDocument(formData);
          formRef.current?.reset();
        });
      }}
      className="flex flex-wrap items-end gap-4"
    >
      {projects.length > 0 && (
        <label className="text-xs text-kov-concrete">
          Projet (facultatif)
          <select
            name="project_id"
            defaultValue=""
            className={FIELD_CLASS}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
          >
            <option value="">Général</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="text-xs text-kov-concrete">
        Fichier
        <input
          type="file"
          name="file"
          required
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-1 block text-sm text-kov-bone file:mr-3 file:border-0 file:bg-kov-red file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-white"
        />
      </label>

      <KovActionButton state={action.state} onStateSettled={action.reset} successLabel="Envoyé" disabled={tooLarge}>
        Envoyer
      </KovActionButton>

      {/* Le nom et le poids du fichier choisi. Le champ natif tronque le nom
          et ne dit rien du poids — or c'est le poids qui fait échouer un
          envoi, et on ne l'apprenait qu'après l'échec. */}
      {file && (
        <p className="w-full text-xs" style={{ color: tooLarge ? "var(--kov-red)" : "var(--kov-concrete)" }}>
          {file.name} · {formatSize(file.size)}
          {tooLarge && " — trop lourd, 25 Mo maximum."}
        </p>
      )}

      {action.error && (
        <p role="alert" className="w-full text-sm" style={{ color: "var(--kov-red)" }}>
          {action.error}
        </p>
      )}
    </form>
  );
}
