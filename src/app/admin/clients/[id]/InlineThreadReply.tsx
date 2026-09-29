"use client";

import { useRef } from "react";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { FIELD_CLASS } from "@/components/ui/fieldStyles";
import { useKovAction } from "@/lib/useKovAction";
import { replyToRequestThread } from "@/app/admin/clients/actions";

// La réponse rapide, depuis la fiche du client.
//
// C'était un <form action={…}> nu : aucun état d'attente, aucun succès, et
// l'erreur renvoyée par l'action était purement et simplement jetée. On
// cliquait « Répondre », il ne se passait rien à l'écran, et rien ne
// distinguait un envoi réussi d'un envoi refusé.
//
// Deux lignes de haut et non cinq : ici on répond d'un mot en passant, la
// conversation se tient dans la messagerie.
export function InlineThreadReply({ threadId }: { threadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = useKovAction({ success: "Réponse envoyée.", fallbackError: "L'envoi a échoué." });

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        action.run(async () => {
          const result = await replyToRequestThread(threadId, formData);
          // L'action renvoie son erreur (voir le #441) : il faut la relever
          // ici pour que le cycle passe en « erreur » au lieu de conclure à
          // un succès silencieux.
          if (result.error) throw new Error(result.error);
          formRef.current?.reset();
        });
      }}
      className="flex items-end gap-4"
    >
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Répondre…"
        className={`${FIELD_CLASS} flex-1`}
        style={{ borderColor: "var(--kov-border)" }}
      />
      <KovActionButton
        variant="secondary"
        state={action.state}
        onStateSettled={action.reset}
        successLabel="Envoyée"
      >
        Répondre
      </KovActionButton>
    </form>
  );
}
