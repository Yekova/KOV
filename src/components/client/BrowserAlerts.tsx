"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getMyNotificationPulse } from "@/app/client/actions";

// L'alerte qui va chercher le client.
//
// Le portail ne prévenait de rien tant qu'on ne l'ouvrait pas : un message
// du studio restait invisible dans l'onglet d'à côté. Ce composant sonde
// « y a-t-il du nouveau ? » et attire l'attention quand la réponse change.
//
// ── DEUX CANAUX, SELON OÙ EST L'UTILISATEUR ──────────────────────────
//
// Onglet en arrière-plan → notification SYSTÈME, qui sort du navigateur.
// Onglet au premier plan  → simple toast. Faire surgir une notification
// système par-dessus une page qu'on est en train de regarder est agressif
// et, sur la plupart des systèmes, elle ne s'affiche même pas.
//
// ── LA PERMISSION N'EST PAS DEMANDÉE ICI ─────────────────────────────
//
// Demander l'autorisation au chargement, sans geste de l'utilisateur, est
// refusé par Chrome et Firefox (et le refus est définitif pour le
// domaine). Elle se demande depuis un bouton, dans le panneau des
// notifications. Ce composant se contente de LIRE `Notification.permission`
// — un état du navigateur, donc partagé sans qu'aucun état React ne
// circule entre les deux.
//
// ── POURQUOI UN SONDAGE ──────────────────────────────────────────────
//
// Il n'y a pas de canal temps réel sur ce projet. Une minute est le
// compromis : assez court pour qu'une réponse ne dorme pas, assez long
// pour que la requête (un compte en tête seule) ne pèse rien. Le sondage
// s'arrête quand l'onglet est masqué depuis longtemps ? Non : c'est
// justement là qu'il sert. Il s'arrête au démontage, c'est tout.

const POLL_MS = 60_000;

export function BrowserAlerts() {
  const router = useRouter();
  // Le compte connu. Initialisé au PREMIER sondage et non à zéro : sinon
  // un client qui ouvre le portail avec trois notifications en attente
  // recevrait aussitôt une alerte pour des messages déjà là.
  const known = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;

    async function check() {
      let pulse: { count: number; latest: string | null };
      try {
        pulse = await getMyNotificationPulse();
      } catch {
        // Une erreur réseau ne doit rien casser ni rien annoncer : on
        // retentera dans une minute.
        return;
      }
      if (!alive) return;

      const previous = known.current;
      known.current = pulse.count;
      if (previous === null || pulse.count <= previous) return;

      const title = pulse.latest ?? "Nouveau message de KOV";

      if (document.visibilityState === "hidden") {
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
        // `tag` remplace la notification précédente au lieu d'en empiler
        // une par sondage : on veut savoir qu'il y a du nouveau, pas
        // recevoir une pile.
        const notification = new Notification("KOV", {
          body: title,
          icon: "/kov/brand/kov-monogram-k-transparent.png",
          tag: "kov-portal",
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
          router.push("/client");
        };
      } else {
        toast(title, { description: "Nouveau dans votre espace." });
        // La page est sous les yeux : on la rafraîchit pour que la
        // pastille et le fil suivent, sans qu'on ait à recharger.
        router.refresh();
      }
    }

    void check();
    const timer = window.setInterval(() => void check(), POLL_MS);
    // Un retour sur l'onglet est le meilleur moment pour vérifier : on
    // vient peut-être de passer dix minutes ailleurs.
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
