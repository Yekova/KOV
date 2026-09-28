"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";
import { LoginLoadingOverlay } from "./LoginLoadingOverlay";

const INITIAL_STATE: LoginState = { error: null };

// Un champ plein plutôt que le trait souligné du reste du site : la carte
// est une surface sombre et unie, et un trait posé dessus se lit comme une
// décoration. Une boîte se lit comme quelque chose où l'on écrit.
const FIELD =
  "kov-login-field h-[52px] w-full rounded-xl border bg-white/[0.045] px-4 pr-11 text-[15px] text-kov-bone outline-none placeholder:text-kov-steel/70";

const LABEL = "mb-2 block font-mono text-[9px] uppercase tracking-[0.24em] text-kov-steel";

// La colonne de droite de la carte.
//
// Ce qui n'y est pas, et pourquoi.
//
// Pas de connexion par Google, Apple ou Microsoft : retirée à la demande.
// Le callback /api/auth/callback reste en place et fonctionne, donc la
// remettre un jour est un composant de boutons à rebrancher, rien de plus.
//
// Pas de case « Rester connecté » : la session Supabase est déjà posée en
// cookie et dure jusqu'à la déconnexion — une case qui ne commande rien
// serait une case qui ment.
//
// Pas de « Créer un compte » : cet espace s'ouvre sur invitation, et le
// dire est plus honnête qu'un lien qui refuserait.
export function LoginForm({
  next,
  justReset,
  notice,
}: {
  next?: string;
  justReset?: boolean;
  /** Un message du callback OAuth, déjà traduit en phrase par la page — le
   *  composant ne connaît pas les codes d'erreur. */
  notice?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {isPending && <LoginLoadingOverlay />}

      <div className="w-full">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-kov-red">Espace KOV</p>

        {/* Le titre de la page. C'est aussi le premier titre qu'un lecteur
            d'écran atteint, et la plus grosse chose de la colonne — les
            légendes du carrousel sont volontairement en dessous en taille
            pour que ces deux rôles ne se disputent pas. */}
        <h1
          className="mt-4 font-display text-kov-bone"
          style={{ fontSize: "clamp(28px, 3vw, 38px)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
        >
          Connexion<span className="text-kov-red">.</span>
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-kov-steel">
          Projets, devis, factures et documents. Reprenez où vous en étiez.
        </p>

        {notice && (
          <p role="alert" className="mt-6 border-l-2 border-kov-red pl-3 text-sm text-kov-bone">
            {notice}
          </p>
        )}

        {justReset && (
          <p className="mt-6 border-l-2 border-kov-red pl-3 text-sm text-kov-bone">
            Mot de passe mis à jour. Vous pouvez vous connecter.
          </p>
        )}

        <form action={formAction} className="mt-8">
          {next && <input type="hidden" name="next" value={next} />}

          <div>
            {/* Un vrai label, pas un placeholder qui en tient lieu : le
                placeholder disparaît à la première frappe, c'est-à-dire
                exactement au moment où l'on a besoin de savoir dans quel
                champ on se trouve. */}
            <label htmlFor="email" className={LABEL}>
              Adresse e-mail
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@exemple.com"
                className={FIELD}
                style={{ borderColor: "var(--kov-border)" }}
              />
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-kov-steel"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="password" className={LABEL}>
                Mot de passe
              </label>
              <Link
                href="/login/forgot"
                className="mb-2 text-[11px] text-kov-steel underline-offset-4 transition-colors hover:text-kov-red hover:underline"
              >
                Oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className={FIELD}
                style={{ borderColor: "var(--kov-border)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-kov-steel transition-colors hover:text-kov-red"
              >
                {showPassword ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.4 5.5A9.7 9.7 0 0 1 12 5c5 0 8.5 4 9.9 7a13 13 0 0 1-3 3.9M6.1 6.9C3.9 8.4 2.3 10.6 2.1 12c.9 2 3 4.6 6 6a9.7 9.7 0 0 0 3.4.9" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M2.1 12S5.5 5 12 5s9.9 7 9.9 7-3.4 7-9.9 7-9.9-7-9.9-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {state.error && (
            <p role="alert" className="mt-5 border-l-2 border-kov-red pl-3 text-sm text-kov-red">
              {state.error}
            </p>
          )}

          {/* Le bouton.
              
              Une seule couleur au repos — de l'os plein, la seule chose
              claire de la colonne, donc la seule qu'on puisse prendre pour
              l'action. Le dégradé rouge en trois arrêts qui était ici ne
              disait rien de plus, et il se battait avec les images, qui
              sont rouges elles aussi.
              
              Le rouge n'a pas disparu : il monte du bas au survol et
              remplit le bouton. C'est la couleur de l'engagement, et elle
              arrive au moment où l'on s'apprête à s'engager. La flèche
              part à droite pendant qu'une autre entre par la gauche — le
              même geste que le bouton, en plus petit.
              
              Pas le Button du site : ce dernier monte un contexte WebGL
              (ogl) pour son reflet, et un écran de connexion n'a pas
              besoin d'une surface GPU pour rendre une commande. */}
          <button type="submit" disabled={isPending} className="kov-login-submit mt-8">
            <span>{isPending ? "Connexion…" : "Se connecter"}</span>
            <span aria-hidden="true" className="kov-login-arrow">
              <span>→</span>
              <span>→</span>
            </span>
          </button>
        </form>

        <div
          className="mt-9 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t pt-6"
          style={{ borderColor: "var(--kov-border)" }}
        >
          <p className="text-xs text-kov-steel">
            Pas encore d&apos;accès ? L&apos;espace s&apos;ouvre sur invitation.{" "}
            <Link href="/contact" className="text-kov-concrete underline-offset-4 transition-colors hover:text-kov-red hover:underline">
              Nous écrire
            </Link>
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-kov-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Connexion chiffrée
          </p>
        </div>
      </div>
    </>
  );
}
