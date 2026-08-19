"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { requestPasswordReset, type ForgotState } from "./actions";

const FIELD_CLASS =
  "w-full bg-transparent border-b py-3 text-kov-bone placeholder:text-kov-steel focus:outline-none focus:border-kov-red transition-colors";

const INITIAL_STATE: ForgotState = { status: "idle", error: null };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, INITIAL_STATE);

  if (state.status === "sent") {
    return (
      <GlassCard className="max-w-md w-full p-8 md:p-12">
        <p className="text-kov-bone text-lg">
          Email envoyé<span className="text-kov-red">.</span> Si un compte existe pour cette adresse, un lien de
          réinitialisation vient d&apos;être envoyé.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-md w-full p-8 md:p-12">
      <p className="font-display text-kov-bone text-xl uppercase mb-1">Mot de passe oublié</p>
      <p className="text-kov-steel text-sm mb-8">On vous envoie un lien de réinitialisation par email.</p>

      <form action={formAction} className="space-y-8">
        <div>
          <label htmlFor="email" className="text-xs uppercase tracking-widest text-kov-steel">
            Email
          </label>
          <input id="email" name="email" type="email" required className={FIELD_CLASS} />
        </div>

        {state.error && <p className="text-kov-red text-sm">{state.error}</p>}

        <Button type="submit" variant="primary" disabled={isPending} className="w-full justify-center">
          {isPending ? "Envoi…" : "Envoyer le lien →"}
        </Button>
      </form>
    </GlassCard>
  );
}
