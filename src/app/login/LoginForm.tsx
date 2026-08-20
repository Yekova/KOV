"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { login, type LoginState } from "./actions";

const FIELD_CLASS =
  "w-full bg-transparent border-b py-3 pr-8 text-kov-bone placeholder:text-kov-steel focus:outline-none focus:border-kov-red transition-colors";

const INITIAL_STATE: LoginState = { error: null };

export function LoginForm({ next, justReset }: { next?: string; justReset?: boolean }) {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <GlassCard className="max-w-md w-full p-8 md:p-12">
      <p className="font-display text-kov-bone text-xl uppercase mb-1">Connexion</p>
      <p className="text-kov-steel text-sm mb-8">Accédez à votre espace client ou admin.</p>

      {justReset && (
        <p className="text-kov-bone text-sm mb-6 border-l-2 border-kov-red pl-3">
          Mot de passe mis à jour. Vous pouvez vous connecter.
        </p>
      )}

      <form action={formAction} className="space-y-8">
        {next && <input type="hidden" name="next" value={next} />}

        <div>
          <label htmlFor="email" className="text-xs uppercase tracking-widest text-kov-steel">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              className={FIELD_CLASS}
            />
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-kov-steel absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
            </svg>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs uppercase tracking-widest text-kov-steel">
              Mot de passe
            </label>
            <Link href="/login/forgot" className="text-xs text-kov-steel hover:text-kov-red transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className={FIELD_CLASS}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-kov-steel hover:text-kov-red transition-colors"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.4 5.5A9.7 9.7 0 0 1 12 5c5 0 8.5 4 9.9 7a13 13 0 0 1-3 3.9M6.1 6.9C3.9 8.4 2.3 10.6 2.1 12c.9 2 3 4.6 6 6a9.7 9.7 0 0 0 3.4.9" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2.1 12S5.5 5 12 5s9.9 7 9.9 7-3.4 7-9.9 7-9.9-7-9.9-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {state.error && <p className="text-kov-red text-sm">{state.error}</p>}

        <Button type="submit" variant="primary" disabled={isPending} className="w-full justify-center">
          {isPending ? "Connexion…" : "Se connecter →"}
        </Button>
      </form>

      <div className="flex items-center gap-2 mt-8 text-kov-steel text-xs">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="11" width="14" height="9" rx="1.5" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Connexion sécurisée
      </div>
    </GlassCard>
  );
}
