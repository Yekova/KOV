"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { KovActionButton, type ActionState } from "@/components/ui/KovActionButton";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const FIELD_CLASS =
  "kov-field w-full bg-transparent border py-2.5 px-3 text-kov-bone placeholder:text-kov-concrete/70 text-sm focus:outline-none";

// Changer son mot de passe.
//
// Dans components/auth et non dans le dossier du portail : il n'a jamais
// rien eu de client. Il passe par le client Supabase du NAVIGATEUR, qui
// connaît la session courante — donc il vaut pour n'importe quel compte,
// et le studio n'en avait tout simplement pas. Un admin ne pouvait pas
// changer son mot de passe depuis l'interface.
//
// Il ne passe pas par useKovAction : il n'appelle pas d'action serveur et
// il valide avant d'envoyer. Le cycle d'états reste le même — c'est le
// contrat qui doit être commun, pas l'implémentation.
export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<ActionState>("idle");
  const [error, setError] = useState<string | null>(null);

  // Validation à la frappe, mais affichée seulement une fois le champ
  // renseigné : rougir un champ vide que personne n'a encore touché, c'est
  // corriger avant la faute.
  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setState("error");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      setState("error");
      return;
    }

    setState("loading");
    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("La mise à jour a échoué.");
      setState("error");
      toast.error("La mise à jour du mot de passe a échoué.");
      return;
    }

    setPassword("");
    setConfirm("");
    setState("success");
    toast.success("Mot de passe mis à jour.");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <label className="block text-xs text-kov-concrete">
        Nouveau mot de passe
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          aria-invalid={tooShort || undefined}
          className={`${FIELD_CLASS} mt-1`}
          style={{
            borderColor: tooShort ? "rgba(227,30,36,0.6)" : "var(--kov-border)",
            borderRadius: "var(--radius-sm)",
          }}
        />
        {tooShort && (
          <span className="mt-1 block text-xs" style={{ color: "var(--kov-red)" }}>
            Au moins 8 caractères.
          </span>
        )}
      </label>

      <label className="block text-xs text-kov-concrete">
        Confirmer
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          aria-invalid={mismatch || undefined}
          className={`${FIELD_CLASS} mt-1`}
          style={{
            borderColor: mismatch ? "rgba(227,30,36,0.6)" : "var(--kov-border)",
            borderRadius: "var(--radius-sm)",
          }}
        />
        {mismatch && (
          <span className="mt-1 block text-xs" style={{ color: "var(--kov-red)" }}>
            Les deux mots de passe ne correspondent pas.
          </span>
        )}
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <KovActionButton
          state={state}
          onStateSettled={() => {
            setState("idle");
            setError(null);
          }}
          successLabel="Mis à jour"
          variant="secondary"
          disabled={password.length === 0}
        >
          Changer le mot de passe
        </KovActionButton>
        {error && (
          <p role="alert" className="text-sm" style={{ color: "var(--kov-red)" }}>
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
