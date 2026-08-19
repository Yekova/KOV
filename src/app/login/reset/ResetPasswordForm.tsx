"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const FIELD_CLASS =
  "w-full bg-transparent border-b py-3 text-kov-bone placeholder:text-kov-steel focus:outline-none focus:border-kov-red transition-colors";

export function ResetPasswordForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // The recovery link lands here with the session as implicit-grant hash
    // tokens (#access_token=...&type=recovery), but this client is
    // configured for the PKCE flow (required for @supabase/ssr's cookie
    // sync), which makes it reject hash tokens via its own auto-detection.
    // Read and apply them manually instead.
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (hashParams.get("type") === "recovery" && accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
        window.history.replaceState(null, "", window.location.pathname);
        setReady(!error);
        setChecking(false);
      });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
      setChecking(false);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirm = formData.get("confirm");

    if (typeof password !== "string" || password.length < 6) {
      setError("6 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setStatus("submitting");

    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError("Une erreur est survenue. Le lien a peut-être expiré.");
      setStatus("idle");
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?reset=success");
  }

  if (checking) {
    return (
      <GlassCard className="max-w-md w-full p-8 md:p-12">
        <p className="text-kov-steel text-sm">Vérification du lien…</p>
      </GlassCard>
    );
  }

  if (!ready) {
    return (
      <GlassCard className="max-w-md w-full p-8 md:p-12">
        <p className="text-kov-bone">Ce lien de réinitialisation est invalide ou a expiré.</p>
        <Button href="/login/forgot" variant="ghost" className="mt-6">
          Demander un nouveau lien →
        </Button>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-md w-full p-8 md:p-12">
      <p className="font-display text-kov-bone text-xl uppercase mb-1">Nouveau mot de passe</p>
      <p className="text-kov-steel text-sm mb-8">Choisissez un nouveau mot de passe pour votre compte.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label htmlFor="password" className="text-xs uppercase tracking-widest text-kov-steel">
            Nouveau mot de passe
          </label>
          <input id="password" name="password" type="password" required minLength={6} className={FIELD_CLASS} />
        </div>

        <div>
          <label htmlFor="confirm" className="text-xs uppercase tracking-widest text-kov-steel">
            Confirmer le mot de passe
          </label>
          <input id="confirm" name="confirm" type="password" required minLength={6} className={FIELD_CLASS} />
        </div>

        {error && <p className="text-kov-red text-sm">{error}</p>}

        <Button type="submit" variant="primary" disabled={status === "submitting"} className="w-full justify-center">
          {status === "submitting" ? "Mise à jour…" : "Mettre à jour →"}
        </Button>
      </form>
    </GlassCard>
  );
}
