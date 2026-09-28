"use client";

import { useEffect, useRef } from "react";
import { setMyPresence } from "@/app/client/actions";

// Ce qui tient la présence du client à jour, sans qu'il ait à y penser.
//
// Monté une fois dans la coquille du portail, il ne rend rien. Il marque
// la présence à l'ouverture, la retire quand l'onglet passe en
// arrière-plan, et la remet quand il revient.
//
// ── POURQUOI visibilitychange ET PAS beforeunload ────────────────────
//
// beforeunload n'est plus fiable : les navigateurs mobiles ne le
// déclenchent souvent pas du tout quand l'application passe en fond ou est
// tuée. visibilitychange, lui, part à chaque bascule d'onglet et au
// passage en arrière-plan sur mobile — c'est le signal que les navigateurs
// s'engagent à envoyer. pagehide complète pour la fermeture d'onglet sur
// ordinateur.
//
// Les deux peuvent partir coup sur coup ; `lastSent` évite d'écrire deux
// fois la même valeur, donc de faire une requête pour rien.
export function PresenceHeartbeat() {
  const lastSent = useRef<boolean | null>(null);

  useEffect(() => {
    const send = (online: boolean) => {
      if (lastSent.current === online) return;
      lastSent.current = online;
      // Sans await ni état : la présence ne doit rien retarder à l'écran, et
      // un échec n'a aucune conséquence visible. On se contente de ne pas
      // retenir la valeur, pour que le prochain signal réessaie.
      void setMyPresence(online).catch(() => {
        lastSent.current = null;
      });
    };

    send(true);

    const onVisibility = () => send(document.visibilityState === "visible");
    const onHide = () => send(false);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      // Le composant part : la navigation quitte le portail.
      send(false);
    };
  }, []);

  return null;
}
