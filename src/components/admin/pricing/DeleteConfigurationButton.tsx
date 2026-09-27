"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteConfiguration, restoreConfiguration } from "@/app/admin/pricing/actions";

// Supprimer un chiffrage, en un clic.
//
// Pas de « êtes-vous sûr ». Une confirmation taxe les centaines de
// suppressions voulues pour protéger de la seule qui ne l'était pas, et
// elle n'y arrive même pas : on répond oui par réflexe, surtout quand on
// vient de cliquer. L'annulation coûte zéro quand tout va bien, et sauve
// exactement le cas qu'on craint.
//
// La restauration réinsère la ligne avec le MÊME identifiant : les versions
// filles et le réel consommé retrouvent leur cible. Une restauration qui
// changerait l'identifiant serait une copie, pas une annulation.
//
// Dix secondes : le temps de lire le toast et de se rendre compte. Au-delà,
// c'est que la suppression était voulue.
const UNDO_WINDOW_MS = 10_000;

export function DeleteConfigurationButton({
  configurationId,
  title,
  label = "Supprimer",
  redirectTo,
  compact = false,
}: {
  configurationId: string;
  title: string;
  label?: string;
  /** Où aller après la suppression. Sans valeur, la liste est simplement rafraîchie. */
  redirectTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteConfiguration(configurationId);
    setPending(false);

    if (result.error || !result.deleted) {
      // Le refus d'un chiffrage déjà devenu devis est une explication, pas
      // un incident : il mérite de rester à l'écran le temps d'être lu.
      toast.error(result.error ?? "La suppression a échoué.", { duration: 8000 });
      return;
    }

    const deleted = result.deleted;
    toast.success(`« ${result.title} » supprimé.`, {
      duration: UNDO_WINDOW_MS,
      action: {
        label: "Annuler",
        onClick: () => {
          void restoreConfiguration(deleted).then((restored) => {
            if (restored.error) {
              toast.error(restored.error);
              return;
            }
            toast.success("Chiffrage restauré.");
            router.push(`/admin/pricing/${restored.configurationId}`);
          });
        },
      },
    });

    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label={`Supprimer ${title}`}
        title={`Supprimer ${title}`}
        className="shrink-0 p-2 text-kov-steel hover:text-kov-red transition-colors disabled:opacity-50"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16" />
          <path d="M10 11v6M14 11v6" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M9 7V4h6v3" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="px-4 py-2 border text-xs uppercase tracking-widest text-kov-steel hover:text-kov-red hover:border-kov-red transition-colors disabled:opacity-50"
      style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
    >
      {pending ? "…" : label}
    </button>
  );
}
