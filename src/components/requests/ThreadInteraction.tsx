"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Ce que le fil et le champ de réponse doivent partager.
//
// Cliquer « Répondre » sur un message se passe dans le FIL ; la citation
// s'affiche au-dessus du CHAMP DE RÉPONSE, qui est un autre sous-arbre,
// de l'autre côté de la zone qui défile. Faire remonter l'état par les
// props obligerait à rendre client toute la page, en-tête et volet de
// droite compris — trois composants serveur perdus pour un état de
// quarante octets.
//
// Le contexte est donc monté par la page, autour des deux.

export interface ReplyTarget {
  id: string;
  authorName: string | null;
  excerpt: string;
}

interface ThreadInteractionValue {
  replyTo: ReplyTarget | null;
  setReplyTo: (target: ReplyTarget | null) => void;
  clearReplyTo: () => void;
}

const ThreadInteractionContext = createContext<ThreadInteractionValue | null>(null);

export function ThreadInteractionProvider({ children }: { children: React.ReactNode }) {
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const clearReplyTo = useCallback(() => setReplyTo(null), []);

  const value = useMemo(() => ({ replyTo, setReplyTo, clearReplyTo }), [replyTo, clearReplyTo]);

  return <ThreadInteractionContext.Provider value={value}>{children}</ThreadInteractionContext.Provider>;
}

/** Rend un objet inerte hors du fournisseur plutôt que de lever : les
 *  composants de message servent aussi ailleurs (la fiche client montre
 *  les dernières demandes), et y planter la page pour un bouton
 *  « Répondre » absent serait disproportionné. */
export function useThreadInteraction(): ThreadInteractionValue {
  const value = useContext(ThreadInteractionContext);
  return value ?? { replyTo: null, setReplyTo: () => {}, clearReplyTo: () => {} };
}
