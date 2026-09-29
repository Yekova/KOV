"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KovInlineLoader } from "@/components/ui/KovSpinner";
import { useKovAction } from "@/lib/useKovAction";

// Ranger une conversation.
//
// Le mot « Supprimer » est employé parce que c'est celui qu'on cherche,
// mais la confirmation dit exactement ce qui se passe : la conversation
// quitte VOTRE liste et reste entière chez l'autre. Une suppression qu'on
// croit commune alors qu'elle ne l'est pas produirait, dans une relation
// commerciale, exactement le malentendu qu'on veut éviter.
//
// La redirection est immédiate après le succès : la page du fil n'existe
// plus pour ce côté, et y rester afficherait un écran introuvable.
export function ThreadTrashButton({
  threadId,
  listHref,
  otherSide,
  onTrash,
}: {
  threadId: string;
  listHref: string;
  /** « le studio » ou « votre client ». */
  otherSide: string;
  onTrash: (threadId: string) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const action = useKovAction({ fallbackError: "La suppression a échoué." });
  const busy = action.state === "loading";

  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={() => {
        if (
          !window.confirm(
            `Supprimer cette conversation ?\n\nElle quitte votre liste et reste récupérable 30 jours dans « Supprimés récemment ». ${otherSide} la garde entière.`
          )
        )
          return;

        action.run(async () => {
          const result = await onTrash(threadId);
          if (result.error) throw new Error(result.error);
          toast.success("Conversation supprimée.");
          router.push(listHref);
        });
      }}
      className="text-kov-concrete hover:text-kov-red text-[11px] tracking-widest uppercase transition-colors disabled:opacity-50"
    >
      {busy ? <KovInlineLoader label="Suppression" /> : "Supprimer"}
    </button>
  );
}
