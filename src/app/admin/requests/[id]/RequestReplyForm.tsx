"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { FIELD_CLASS, FIELD_LABEL, FIELD_STYLE } from "@/components/ui/fieldStyles";
import { replyToRequestThread } from "@/app/admin/clients/actions";

// La réponse à une demande.
//
// Elle réutilise replyToRequestThread, l'action qui sert déjà depuis la
// fiche client : même écriture, même bascule du fil en « répondue », même
// notification. Ce n'est pas un second chemin d'envoi, c'est le même vu
// depuis un autre écran.

export function RequestReplyForm({ threadId }: { threadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [, action, pending] = useActionState(async (_prev: null, formData: FormData) => {
    try {
      await replyToRequestThread(threadId, formData);
      // Vidé seulement après un envoi réussi : un échec doit rendre le
      // texte, pas le faire disparaître.
      formRef.current?.reset();
      toast.success("Réponse envoyée.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "L'envoi a échoué.");
    }
    return null;
  }, null);

  return (
    <GlassCard className="p-6">
      <form ref={formRef} action={action}>
        <label className={FIELD_LABEL} htmlFor="reply-body">
          Répondre au client
        </label>
        <textarea
          id="reply-body"
          name="body"
          rows={5}
          required
          placeholder="Votre réponse s'affichera dans son espace."
          className={`${FIELD_CLASS} mt-1`}
          style={FIELD_STYLE}
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="submit"
            disabled={pending}
            className="px-6 py-2.5 bg-kov-red text-kov-white text-xs uppercase tracking-widest hover:bg-kov-red-signal transition-colors disabled:opacity-50"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            {pending ? "Envoi…" : "Envoyer"}
          </button>
          <p className="text-kov-steel text-[11px]">
            Le fil passe en « répondue » et le client voit votre message dans son espace.
          </p>
        </div>
      </form>
    </GlassCard>
  );
}
