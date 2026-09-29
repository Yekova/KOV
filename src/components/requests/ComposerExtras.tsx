"use client";

import { useRef, useState } from "react";
import { useThreadInteraction } from "@/components/requests/ThreadInteraction";

// Ce qui entoure le champ de réponse : la citation et les fichiers.
//
// Écrit une fois pour les deux côtés. Les deux formulaires diffèrent par
// leur enveloppe et leurs libellés, pas par ces deux gestes — et deux
// copies auraient fini par ne plus envoyer les mêmes champs.

/** Le message auquel on répond, et le champ caché qui le transmet.
 *  Rend null quand aucun message n'est visé : la bannière ne doit pas
 *  occuper de place en permanence au-dessus du champ. */
export function ReplyQuoteBanner() {
  const { replyTo, clearReplyTo } = useThreadInteraction();
  if (!replyTo) return null;

  return (
    <div
      className="kov-enter mb-2 flex items-start gap-3 px-3 py-2"
      style={{
        background: "var(--kov-lift-1)",
        borderLeft: "2px solid var(--kov-red)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <input type="hidden" name="reply_to_id" value={replyTo.id} />
      <p className="min-w-0 flex-1 text-[11px] leading-relaxed">
        <span className="text-kov-concrete">Réponse à </span>
        <span className="text-kov-bone">{replyTo.authorName ?? "un message"}</span>
        <span className="text-kov-concrete"> · {replyTo.excerpt}</span>
      </p>
      <button
        type="button"
        onClick={clearReplyTo}
        aria-label="Ne plus répondre à ce message"
        className="text-kov-concrete hover:text-kov-red shrink-0 text-sm leading-none transition-colors"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Le choix des fichiers.
 *
 * Le champ natif est masqué et remplacé par un bouton : `<input
 * type="file">` ne se met pas au format du reste, et son libellé
 * (« Aucun fichier sélectionné ») est écrit par le navigateur, dans la
 * langue du système et sans qu'on puisse le changer.
 *
 * Les fichiers choisis s'affichent en pastilles retirables. Sans elles,
 * on ne sait pas ce qu'on s'apprête à envoyer — et un fichier ajouté par
 * erreur ne peut plus être retiré sans tout recommencer.
 */
export function AttachmentField({ max = 5 }: { max?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  function sync(next: File[]) {
    setFiles(next);
    // Le champ natif reste la source de vérité pour l'envoi : on lui
    // réécrit la liste, sinon retirer une pastille ne retirerait rien.
    const transfer = new DataTransfer();
    for (const file of next) transfer.items.add(file);
    if (inputRef.current) inputRef.current.files = transfer.files;
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        name="attachments"
        multiple
        className="hidden"
        onChange={(event) => sync(Array.from(event.target.files ?? []).slice(0, max))}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Joindre un fichier"
        title="Joindre un fichier"
        className="text-kov-concrete hover:text-kov-bone flex h-9 w-9 items-center justify-center transition-colors"
        style={{ borderRadius: "var(--radius-sm)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21.4 11.05 12.25 20.2a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.67 3.67 0 0 1 5.18 5.18l-9.2 9.2a1.83 1.83 0 1 1-2.59-2.6l8.49-8.48"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {files.length > 0 && (
        <ul className="flex w-full flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="text-kov-bone flex items-center gap-2 px-2.5 py-1 text-[11px]"
              style={{
                background: "var(--kov-lift-2)",
                border: "1px solid var(--kov-border)",
                borderRadius: "var(--radius-pill)",
              }}
            >
              <span className="max-w-[14rem] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => sync(files.filter((_, i) => i !== index))}
                aria-label={`Retirer ${file.name}`}
                className="text-kov-concrete hover:text-kov-red leading-none transition-colors"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
