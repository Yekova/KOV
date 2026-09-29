"use client";

import { KovInlineAction } from "@/components/ui/KovInlineAction";
import { deactivateAdmin, reactivateAdmin } from "./actions";

export function DeactivateAdminButton({ adminId, isArchived }: { adminId: string; isArchived: boolean }) {
  return (
    <KovInlineAction
      label={isArchived ? "Réactiver" : "Désactiver"}
      pendingLabel={isArchived ? "Réactivation" : "Désactivation"}
      confirmMessage={
        isArchived
          ? "Réactiver ce compte ? L'accès à l'espace admin sera restauré."
          : "Désactiver ce compte ? L'accès à l'espace admin sera immédiatement coupé."
      }
      success={isArchived ? "Compte réactivé." : "Compte désactivé."}
      fallbackError="L'action a échoué."
      onRun={() => (isArchived ? reactivateAdmin(adminId) : deactivateAdmin(adminId))}
      className="whitespace-nowrap"
    />
  );
}
