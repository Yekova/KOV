"use client";

import { useEffect, useState, useTransition } from "react";
import { logout } from "@/app/login/actions";

// Se déconnecter, en deux temps.
//
// ── POURQUOI UNE CONFIRMATION ────────────────────────────────────────
//
// L'entrée était le dernier élément d'un menu dont les autres sont
// anodins — profil, disponibilité. Un clic de trop et la session est
// fermée : pas grave en soi, mais il faut se reconnecter, et sur un
// formulaire qu'on a rempli à moitié c'est du travail perdu.
//
// ── POURQUOI PAS UNE MODALE ──────────────────────────────────────────
//
// Ce bouton vit DANS un menu déjà porté vers <body> par createPortal. Y
// ouvrir une seconde couche portée demanderait de gérer deux pièges de
// focus imbriqués et deux fermetures à l'Échap, pour une question à deux
// mots. La confirmation se fait donc sur place : l'entrée se remplace
// elle-même.
//
// Elle revient d'elle-même au bout de cinq secondes. Une question laissée
// ouverte dans un menu qu'on a quitté des yeux redevient un piège au
// prochain regard.

const REVERT_MS = 5000;

export function LogoutButton({ className = "" }: { className?: string }) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!asking) return;
    const timer = window.setTimeout(() => setAsking(false), REVERT_MS);
    return () => window.clearTimeout(timer);
  }, [asking]);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={`text-kov-bone hover:text-kov-red w-full px-4 py-2 text-left text-xs tracking-widest uppercase transition-colors ${className}`}
      >
        Se déconnecter
      </button>
    );
  }

  return (
    <div className="px-4 py-2">
      <p className="text-kov-concrete text-[11px]">Vous déconnecter de cet appareil et des autres ?</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          // Rappel asynchrone : avec un rappel synchrone la transition se
          // termine avant que l'action revienne, et « Déconnexion… » ne
          // s'afficherait jamais.
          onClick={() =>
            startTransition(async () => {
              await logout();
            })
          }
          className="text-kov-white inline-flex h-8 items-center px-3 text-[11px] tracking-widest uppercase transition-colors disabled:opacity-60"
          style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
        >
          {pending ? "Déconnexion…" : "Oui"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setAsking(false)}
          className="text-kov-concrete hover:text-kov-bone inline-flex h-8 items-center px-3 text-[11px] tracking-widest uppercase transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
