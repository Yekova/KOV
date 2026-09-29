"use client";

import { KovInlineAction } from "@/components/ui/KovInlineAction";
import { deleteDocument } from "../actions";

export function DeleteDocumentButton({ documentId, filename }: { documentId: string; filename: string }) {
  return (
    <KovInlineAction
      label="Supprimer"
      pendingLabel="Suppression"
      confirmMessage={`Supprimer définitivement « ${filename} » ?`}
      success="Document supprimé."
      fallbackError="La suppression a échoué."
      onRun={() => deleteDocument(documentId)}
    />
  );
}
