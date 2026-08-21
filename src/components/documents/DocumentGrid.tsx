"use client";

import { useState } from "react";
import { DocumentTypeIcon, documentKindFromMime, formatFileSize } from "@/lib/documentIcons";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

export interface DocumentGridItem {
  id: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  thumbnailUrl: string | null; // pre-signed, only set server-side for images
}

interface DocumentGridProps {
  documents: DocumentGridItem[];
  getPreviewUrl: (documentId: string) => Promise<{ url: string; mimeType: string | null }>;
  downloadAction: (formData: FormData) => Promise<void>;
  // Omitted on the read-only client portal — only the admin GED can delete.
  onDelete?: (documentId: string) => Promise<void>;
}

export function DocumentGrid({ documents, getPreviewUrl, downloadAction, onDelete }: DocumentGridProps) {
  const [active, setActive] = useState<DocumentGridItem | null>(null);
  const [query, setQuery] = useState("");

  if (documents.length === 0) {
    return <p className="text-kov-steel text-sm">Aucun document dans ce dossier.</p>;
  }

  const visible = query.trim()
    ? documents.filter((doc) => doc.filename.toLowerCase().includes(query.trim().toLowerCase()))
    : documents;

  return (
    <>
      {documents.length > 8 && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer par nom de fichier…"
          className="w-full max-w-sm mb-4 bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
      )}
      {visible.length === 0 ? (
        <p className="text-kov-steel text-sm">Aucun document ne correspond à « {query} ».</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visible.map((doc) => {
            const kind = documentKindFromMime(doc.mimeType, doc.filename);
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setActive(doc)}
                className="text-left border p-3 hover:border-kov-red transition-colors"
                style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
              >
                <div
                  className="aspect-square w-full mb-3 flex items-center justify-center overflow-hidden"
                  style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-sm)" }}
                >
                  {kind === "image" && doc.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={doc.thumbnailUrl} alt={doc.filename} className="w-full h-full object-cover" />
                  ) : (
                    <DocumentTypeIcon kind={kind} className="w-10 h-10 text-kov-steel" />
                  )}
                </div>
                <p className="text-kov-bone text-xs truncate">{doc.filename}</p>
                <p className="text-kov-steel text-[11px] mt-1">{formatFileSize(doc.sizeBytes)}</p>
              </button>
            );
          })}
        </div>
      )}

      {active && (
        <DocumentPreviewModal
          item={active}
          getPreviewUrl={getPreviewUrl}
          downloadAction={downloadAction}
          onDelete={
            onDelete
              ? async () => {
                  await onDelete(active.id);
                  setActive(null);
                }
              : undefined
          }
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
