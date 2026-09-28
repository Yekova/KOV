"use server";

import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Marquer ses notifications comme lues, et c'est maintenant un geste.
//
// C'était un effet de bord du rendu du tableau de bord : une écriture en
// base sur un GET, déclenchée par le simple affichage de la page
// d'atterrissage du portail. Deux conséquences, et la seconde était pire
// que la première.
//
// Le compteur de la cloche était NON DÉTERMINISTE : PortalTopbarData compte
// les activity_log non lues dans sa propre frontière Suspense, pendant que
// la page les passait toutes en lues. Les deux requêtes partaient en même
// temps, et le badge affichait 3 ou 0 selon celle qui touchait la base en
// premier — pour le même état.
//
// Et comme le tableau de bord est la page d'atterrissage, une seule visite
// suffisait à tout marquer lu. Le badge ne pouvait donc quasiment jamais
// s'afficher : le système de notification était défait par sa propre page
// d'accueil.
//
// Ici, l'écriture suit l'ouverture du panneau. Elle ne prend plus d'id en
// paramètre non plus : une action appelable depuis le navigateur qui
// accepte un client_id laisserait n'importe qui marquer lues les
// notifications de n'importe qui. L'utilisateur vient de la session.
export async function markMyNotificationsRead() {
  const user = await requireUser();
  await supabaseAdmin
    .from("activity_log")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", user.id)
    .is("read_at", null);
}

// La présence du client, tenue automatiquement.
//
// Côté studio, « en ligne » est un interrupteur : on décide d'être
// joignable. Côté client, personne ne va cliquer sur un bouton pour dire
// qu'il regarde son espace — donc c'est l'espace qui le dit, à l'ouverture
// et quand l'onglet revient au premier plan.
//
// ── CE QUE ÇA NE PEUT PAS FAIRE ──────────────────────────────────────
//
// Un navigateur tué net ne prévient personne. Le drapeau peut donc rester
// à vrai après le départ. Trois choses le rattrapent : le passage de
// l'onglet en arrière-plan, la fermeture de l'onglet quand le navigateur
// veut bien la signaler, et la déconnexion.
//
// La solution propre serait une colonne last_seen_at et une présence
// dérivée (« vu il y a moins de cinq minutes »), qui n'a aucun état à
// remettre à zéro. Elle demande une migration : à faire le jour où on en
// passe une autre.
export async function setMyPresence(online: boolean) {
  const user = await requireUser();
  await supabaseAdmin.from("profiles").update({ is_online: online }).eq("id", user.id);
}
