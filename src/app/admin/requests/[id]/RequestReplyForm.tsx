"use client";

import { useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FIELD_CLASS, FIELD_LABEL, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { KovActionButton } from "@/components/ui/KovActionButton";
import { EmojiPicker } from "@/components/requests/EmojiPicker";
import { useKovAction } from "@/lib/useKovAction";
import { replyToRequestThread } from "@/app/admin/clients/actions";

// La réponse à une demande.
//
// Elle réutilise replyToRequestThread, l'action qui sert déjà depuis la
// fiche client : même écriture, même bascule du fil en « répondue », même
// notification. Ce n'est pas un second chemin d'envoi, c'est le même vu
// depuis un autre écran.
//
// Le bouton est celui du portail (KovActionButton), pas un rectangle
// rouge : le studio et le client écrivent dans la même messagerie, le
// geste d'envoi doit y être le même. Il apporte au passage ce qui manquait
// ici — l'état de succès. L'ancien bouton passait à « Envoi… » puis
// revenait à « Envoyer », ce qui est indistinguable d'un envoi qui n'a
// jamais eu lieu.
export function RequestReplyForm({ threadId }: { threadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const action = useKovAction({ success: "Réponse envoyée.", fallbackError: "L'envoi a échoué." });

  return (
    <GlassCard className="p-6">
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          action.run(async () => {
            await replyToRequestThread(threadId, formData);
            // Vidé seulement après un envoi réussi : un échec doit rendre
            // le texte, pas le faire disparaître.
            formRef.current?.reset();
          });
        }}
      >
        <label className={FIELD_LABEL} htmlFor="reply-body">
          Répondre au client
        </label>
        <textarea
          ref={bodyRef}
          id="reply-body"
          name="body"
          rows={5}
          required
          placeholder="Votre réponse s'affichera dans son espace."
          className={`${FIELD_CLASS} mt-1`}
          style={FIELD_STYLE}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <KovActionButton state={action.state} onStateSettled={action.reset}>
            Envoyer
          </KovActionButton>
          <EmojiPicker targetRef={bodyRef} />
          {action.error ? (
            <p role="alert" className="text-sm" style={{ color: "var(--kov-red)" }}>
              {action.error}
            </p>
          ) : (
            <p className="text-kov-steel text-[11px]">
              Le fil passe en « répondue » et le client voit votre message dans son espace.
            </p>
          )}
        </div>
      </form>
    </GlassCard>
  );
}
