"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";
import { LoginLoadingOverlay } from "./LoginLoadingOverlay";

const INITIAL_STATE: LoginState = { error: null };

// A filled field rather than the underline the rest of the site uses.
// Against a photograph an underline is a line on an image; a filled box is
// a thing you can type into, which is what this screen is for.
const FIELD =
  "h-[52px] w-full rounded-xl border bg-white/[0.045] px-4 pr-11 text-[15px] text-kov-bone outline-none transition-colors placeholder:text-kov-steel/70 focus:border-kov-red";

const LABEL = "mb-2 block font-mono text-[9px] uppercase tracking-[0.24em] text-kov-steel";

export function LoginForm({ next, justReset }: { next?: string; justReset?: boolean }) {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {isPending && <LoginLoadingOverlay />}

      <div
        className="w-full max-w-[440px] p-8 sm:p-10"
        style={{
          borderRadius: 22,
          border: "1px solid var(--glass-border)",
          background: "rgba(12,12,14,0.62)",
          backdropFilter: "blur(26px) saturate(140%)",
          WebkitBackdropFilter: "blur(26px) saturate(140%)",
          boxShadow: "var(--glass-shadow-full)",
        }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.26em] text-kov-bone">
            <span aria-hidden="true" className="inline-block h-px w-6 bg-kov-red" />
            Connexion
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-kov-steel">Bienvenue</p>
        </div>

        <h2
          className="mt-7 font-display text-kov-bone"
          style={{ fontSize: "clamp(28px, 3.4vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
        >
          Accédez
          <br />à votre espace<span className="text-kov-red">.</span>
        </h2>

        {justReset && (
          <p className="mt-6 border-l-2 border-kov-red pl-3 text-sm text-kov-bone">
            Mot de passe mis à jour. Vous pouvez vous connecter.
          </p>
        )}

        <form action={formAction} className="mt-8">
          {next && <input type="hidden" name="next" value={next} />}

          <div>
            {/* A real label, not a placeholder standing in for one: a
                placeholder disappears the moment someone types, which is
                exactly when they need to know which field they are in. */}
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
            <label htmlFor="password" className={LABEL}>
              Mot de passe
            </label>
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

          <div className="mt-4 flex justify-end">
            <Link
              href="/login/forgot"
              className="text-xs text-kov-steel underline-offset-4 transition-colors hover:text-kov-red hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {state.error && (
            <p role="alert" className="mt-5 border-l-2 border-kov-red pl-3 text-sm text-kov-red">
              {state.error}
            </p>
          )}

          {/* A plain button with a gradient, not the site's primary Button:
              that one mounts an ogl WebGL context for its specular sheen,
              and a login screen already carrying a full-bleed photograph
              does not need a second GPU surface to render one control. */}
          <button
            type="submit"
            disabled={isPending}
            className="group mt-7 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-full text-sm font-medium text-kov-white transition-[filter,transform] duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              background: "linear-gradient(100deg, #5e0d10 0%, #e31e24 52%, #6d0f13 100%)",
              boxShadow: "0 12px 40px -18px rgba(227,30,36,0.9)",
            }}
          >
            {isPending ? "Connexion…" : "Se connecter"}
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>
        </form>

        <p className="mt-7 flex items-center justify-center gap-2 text-xs text-kov-steel">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Connexion sécurisée et chiffrée
        </p>
      </div>
    </>
  );
}
