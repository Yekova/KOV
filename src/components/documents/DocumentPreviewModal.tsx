"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { DocumentTypeIcon, documentKindFromMime, formatFileSize } from "@/lib/documentIcons";
import { motion, LIQUID_EASE } from "@/lib/motion";
import type { DocumentGridItem } from "./DocumentGrid";

interface DocumentPreviewModalProps {
  item: DocumentGridItem;
  getPreviewUrl: (documentId: string) => Promise<{ url: string; mimeType: string | null }>;
  downloadAction: (formData: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export function DocumentPreviewModal({ item, getPreviewUrl, downloadAction, onDelete, onClose }: DocumentPreviewModalProps) {
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(item.mimeType);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPreviewUrl(item.id)
      .then((res) => {
        if (cancelled) return;
        setUrl(res.url);
        setMimeType(res.mimeType);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Aperçu indisponible.");
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, getPreviewUrl]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, motion.fast * 1000);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kind = documentKindFromMime(mimeType, item.filename);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{
        background: "rgba(10, 10, 10, 0.7)",
        opacity: visible ? 1 : 0,
        transition: `opacity ${motion.fast}s ${LIQUID_EASE}`,
      }}
      onClick={handleClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "min(900px, 92vw)",
          transform: visible ? "scale(1)" : "scale(0.96)",
          transition: `transform ${motion.fast}s ${LIQUID_EASE}`,
        }}
      >
        <GlassCard variant="solid" className="p-5 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-kov-bone text-sm truncate">{item.filename}</p>
            <button
              type="button"
              onClick={handleClose}
              className="text-kov-steel hover:text-kov-red transition-colors text-xs uppercase tracking-widest shrink-0"
            >
              Fermer ✕
            </button>
          </div>

          <div
            className="flex items-center justify-center overflow-hidden mb-4"
            style={{ height: "60vh", background: "var(--kov-black)", borderRadius: "var(--radius-sm)" }}
          >
            {error ? (
              <p className="text-kov-red text-sm px-6 text-center">{error}</p>
            ) : !url ? (
              <p className="text-kov-steel text-sm">Chargement…</p>
            ) : kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={item.filename} className="max-w-full max-h-full object-contain" />
            ) : kind === "pdf" ? (
              <iframe src={url} title={item.filename} className="w-full h-full" style={{ border: "none" }} />
            ) : (
              <div className="flex flex-col items-center gap-3 text-kov-steel">
                <DocumentTypeIcon kind={kind} className="w-12 h-12" />
                <p className="text-sm">Aperçu non disponible pour ce type de fichier.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-kov-steel text-xs">{formatFileSize(item.sizeBytes)}</p>
            <div className="flex items-center gap-4">
              {onDelete && (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    if (!window.confirm(`Supprimer définitivement « ${item.filename} » ?`)) return;
                    setIsDeleting(true);
                    onDelete().catch((err) => {
                      setIsDeleting(false);
                      setError(err instanceof Error ? err.message : "La suppression a échoué.");
                    });
                  }}
                  className="text-kov-red text-xs uppercase tracking-widest hover:underline disabled:opacity-50"
                >
                  {isDeleting ? "Suppression…" : "Supprimer"}
                </button>
              )}
              <form action={downloadAction}>
                <input type="hidden" name="document_id" value={item.id} />
                <Button type="submit" variant="primary">
                  Télécharger
                </Button>
              </form>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>,
    document.body
  );
}
