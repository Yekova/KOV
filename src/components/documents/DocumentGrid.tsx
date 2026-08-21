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
}

export function DocumentGrid({ documents, getPreviewUrl, downloadAction }: DocumentGridProps) {
  const [active, setActive] = useState<DocumentGridItem | null>(null);

  if (documents.length === 0) {
    return <p className="text-kov-steel text-sm">Aucun document dans ce dossier.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {documents.map((doc) => {
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

      {active && (
        <DocumentPreviewModal
          item={active}
          getPreviewUrl={getPreviewUrl}
          downloadAction={downloadAction}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
