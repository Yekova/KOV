"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/components/ui/KovActionButton";

// Le cycle d'une action, écrit une fois.
//
// Les six formulaires du portail portaient chacun leur propre copie :
// useTransition, un état d'erreur, un try/catch, et rien pour le succès.
// Le cycle demandé — clic → chargement → succès ou erreur → retour — était
// donc à réimplémenter à chaque nouvelle action, et l'oubli du succès
// s'était produit six fois sur six.
//
// Ce hook le tient. Il donne l'état au bouton, lève un toast, et revient
// de lui-même au repos.
//
// ── DEUX GARDES QUI COMPTENT ─────────────────────────────────────────
//
// Le double-clic : `pending` bloque le second appel avant même qu'il
// parte. Sans ça, cliquer deux fois sur « Envoyer » crée deux demandes.
//
// Le démontage : si le composant part pendant l'attente — navigation,
// fermeture d'une modale — on n'écrit plus dans un état qui n'existe
// plus, et surtout on ne lève pas un toast de succès pour un écran que
// personne ne regarde plus.

export interface KovActionOptions {
  /** Le toast de succès. Omis, aucun toast n'est levé. */
  success?: string;
  /** Ce qu'on affiche si l'action jette sans message lisible. */
  fallbackError?: string;
  onSuccess?: () => void;
}

export function useKovAction({ success, fallbackError = "L'action a échoué.", onSuccess }: KovActionOptions = {}) {
  const [state, setState] = useState<ActionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const aliveRef = useRef(true);
  const runningRef = useRef(false);

  // Remis à vrai dans le corps de l'effet, pas seulement à l'initialisation :
  // en mode strict React monte, démonte et remonte, donc un ref posé une
  // seule fois resterait faux pour toute la vie du composant remonté.
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
  }, []);

  const run = useCallback(
    (task: () => Promise<void>) => {
      // Le second clic ne part pas. `pending` de useTransition ne suffit
      // pas ici : il ne devient vrai qu'au rendu suivant, donc deux clics
      // rapprochés passent tous les deux.
      if (runningRef.current) return;
      runningRef.current = true;
      setState("loading");
      setError(null);

      startTransition(async () => {
        try {
          await task();
          if (!aliveRef.current) return;
          setState("success");
          if (success) toast.success(success);
          onSuccess?.();
        } catch (caught) {
          if (!aliveRef.current) return;
          const message = caught instanceof Error && caught.message ? caught.message : fallbackError;
          setState("error");
          setError(message);
          toast.error(message);
        } finally {
          runningRef.current = false;
        }
      });
    },
    [fallbackError, onSuccess, success]
  );

  return { state, error, pending, run, reset };
}
