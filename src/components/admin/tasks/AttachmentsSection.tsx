"use client";

import { useRef, useState, useTransition } from "react";
import { uploadTaskAttachment, deleteTaskAttachment, getTaskAttachmentUrl } from "@/app/admin/tasks/actions";
import { formatFileSize } from "@/lib/documentIcons";

type Attachment = { id: string; filename: string; mimeType: string | null; sizeBytes: number; createdAt: string };

export function AttachmentsSection({
  taskId,
  attachments,
  onChange,
}: {
  taskId: string;
  attachments: Attachment[];
  onChange: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(file: File) {
    const formData = new FormData();
    formData.set("task_id", taskId);
    formData.set("file", file);
    setError(null);
    startTransition(async () => {
      try {
        await uploadTaskAttachment(formData);
        onChange();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Le téléversement a échoué.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">Fichiers</p>

      {attachments.length > 0 && (
        <ul className="space-y-2 mb-3">
          {attachments.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-2 group">
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    try {
                      const url = await getTaskAttachmentUrl(doc.id);
                      window.open(url, "_blank", "noopener,noreferrer");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Le téléchargement a échoué.");
                    }
                  });
                }}
                className="text-kov-bone hover:text-kov-red text-sm text-left truncate transition-colors"
              >
                {doc.filename}
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-kov-steel text-xs">{formatFileSize(doc.sizeBytes)}</span>
                <button
                  type="button"
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await deleteTaskAttachment(doc.id);
                        onChange();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "La suppression a échoué.");
                      }
                    });
                  }}
                  className="text-kov-steel hover:text-kov-red text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Supprimer"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-kov-red text-xs mb-2">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        disabled={isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        className="text-kov-steel text-xs disabled:opacity-50"
      />
    </div>
  );
}
