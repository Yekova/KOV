"use client";

import { useEffect } from "react";

// La portée du thème clair, étendue au <body>.
//
// ── LE PROBLÈME QUE ÇA RÉSOUT ────────────────────────────────────────
//
// `.kov-admin` est posé sur la coquille, et redéfinit les tokens pour tout
// ce qu'elle contient. Mais dix composants de l'admin rendent par
// createPortal dans <body> — les menus, la palette de recherche, les
// modales, le panneau de tâche. Ils sortent donc de l'arbre, et avec lui
// de la portée : ils se rendraient en palette SOMBRE au milieu d'une page
// claire.
//
// L'alternative était d'envelopper le contenu porté de chacun des dix dans
// un <div class="kov-admin">, comme le portail client le fait. Une ligne
// ici couvre les dix, et couvrira le onzième que personne ne pensera à
// envelopper.
//
// ── POURQUOI ÇA NE FUIT PAS ──────────────────────────────────────────
//
// La classe est retirée au démontage. Elle ne vit donc que sur les routes
// /admin ; le site public et l'espace client, qui partagent ces mêmes
// composants, restent sombres.
//
// Elle reste AUSSI sur la coquille elle-même : celle-ci est rendue côté
// serveur, et le premier affichage doit déjà être clair. Ce composant ne
// couvre que ce qui naît côté navigateur.
export function AdminThemeScope() {
  useEffect(() => {
    document.body.classList.add("kov-admin");
    return () => document.body.classList.remove("kov-admin");
  }, []);

  return null;
}
