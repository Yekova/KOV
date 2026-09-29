"use client";

import { KovInlineAction } from "@/components/ui/KovInlineAction";
import { archiveClient, unarchiveClient } from "../actions";

export function ArchiveClientButton({ clientId, isArchived }: { clientId: string; isArchived: boolean }) {
  return (
    <KovInlineAction
      label={isArchived ? "Réactiver le client" : "Archiver le client"}
      pendingLabel={isArchived ? "Réactivation" : "Archivage"}
      confirmMessage={
        isArchived
          ? "Réactiver ce client ? Il réapparaîtra dans la liste par défaut."
          : "Archiver ce client ? Il n'apparaîtra plus dans la liste par défaut, mais rien n'est supprimé."
      }
      success={isArchived ? "Client réactivé." : "Client archivé."}
      fallbackError="L'action a échoué."
      onRun={() => (isArchived ? unarchiveClient(clientId) : archiveClient(clientId))}
    />
  );
}
