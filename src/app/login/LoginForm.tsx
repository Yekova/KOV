"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { login, type LoginState } from "./actions";

const FIELD_CLASS =
  "w-full bg-transparent border-b py-3 text-kov-bone placeholder:text-kov-steel focus:outline-none focus:border-kov-red transition-colors";

const INITIAL_STATE: LoginState = { error: null };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);

  return (
    <GlassCard className="max-w-md w-full p-8 md:p-12">
      <form action={formAction} className="space-y-8">
        {next && <input type="hidden" name="next" value={next} />}

        <div>
          <label htmlFor="email" className="text-xs uppercase tracking-widest text-kov-steel">
            Email
          </label>
          <input id="email" name="email" type="email" required className={FIELD_CLASS} />
        </div>

        <div>
          <label htmlFor="password" className="text-xs uppercase tracking-widest text-kov-steel">
            Mot de passe
          </label>
          <input id="password" name="password" type="password" required className={FIELD_CLASS} />
        </div>

        {state.error && <p className="text-kov-red text-sm">{state.error}</p>}

        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Connexion…" : "Se connecter →"}
        </Button>
      </form>
    </GlassCard>
  );
}
