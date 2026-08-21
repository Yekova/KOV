"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const FIELD_CLASS =
  "w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-steel text-sm focus:outline-none focus:border-kov-red transition-colors";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsPending(true);
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsPending(false);

    if (updateError) {
      setError("La mise à jour a échoué.");
      return;
    }

    setSaved(true);
    setPassword("");
    setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <label className="block text-xs text-kov-steel">
        Nouveau mot de passe
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={`${FIELD_CLASS} mt-1`}
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
      </label>
      <label className="block text-xs text-kov-steel">
        Confirmer le mot de passe
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className={`${FIELD_CLASS} mt-1`}
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        />
      </label>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Mise à jour…" : "Changer le mot de passe"}
        </Button>
        {error && <p className="text-kov-red text-sm">{error}</p>}
        {saved && !error && <p className="text-kov-steel text-sm">Mot de passe mis à jour ✓</p>}
      </div>
    </form>
  );
}
