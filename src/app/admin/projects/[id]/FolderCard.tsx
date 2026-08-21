"use client";

import { useState, useTransition, type MouseEvent } from "react";
import Link from "next/link";
import { FolderIcon } from "@/lib/documentIcons";
import { renameDocumentFolder, deleteDocumentFolder } from "./actions";

export function FolderCard({ projectId, folderId, name }: { projectId: string; folderId: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRename(event: MouseEvent) {
    event.preventDefault();
    const next = window.prompt("Renommer le dossier", name);
    if (!next || !next.trim() || next.trim() === name) return;
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("name", next.trim());
        await renameDocumentFolder(folderId, formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Le renommage a échoué.");
      }
    });
  }

  function handleDelete(event: MouseEvent) {
    event.preventDefault();
    if (!window.confirm(`Supprimer le dossier « ${name} » ? Les fichiers qu'il contient seront déplacés à la racine du projet.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteDocumentFolder(folderId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "La suppression a échoué.");
      }
    });
  }

  return (
    <div className="relative group">
      <Link
        href={`/admin/projects/${projectId}?folder=${folderId}`}
        className="border p-4 flex flex-col items-center gap-2 hover:border-kov-red transition-colors"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
      >
        <FolderIcon className="w-8 h-8 text-kov-steel" />
        <p className="text-kov-bone text-xs text-center truncate w-full">{name}</p>
      </Link>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          disabled={isPending}
          onClick={handleRename}
          className="w-5 h-5 flex items-center justify-center text-kov-steel hover:text-kov-bone text-xs"
          title="Renommer"
        >
          ✎
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="w-5 h-5 flex items-center justify-center text-kov-steel hover:text-kov-red text-xs"
          title="Supprimer"
        >
          ✕
        </button>
      </div>
      {error && <p className="text-kov-red text-[10px] mt-1 text-center">{error}</p>}
    </div>
  );
}
