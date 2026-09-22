"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ProviderId = "google" | "apple" | "azure";

const PROVIDERS: readonly { id: ProviderId; label: string; mark: React.ReactNode }[] = [
  {
    id: "apple",
    label: "Apple",
    mark: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 3-.85.98-2.24 1.74-3.4 1.65a3.7 3.7 0 0 1 1.14-2.9c.78-.87 2.14-1.55 3.38-1.6.01.09 0 .18 0 .28zM20.5 17.2c-.36.83-.53 1.2-1 1.94-.65 1.03-1.57 2.31-2.71 2.32-1.01.01-1.27-.66-2.65-.65-1.38 0-1.66.66-2.67.65-1.14-.01-2.01-1.17-2.66-2.2-1.82-2.87-2.01-6.24-.89-8.03.8-1.28 2.06-2.03 3.24-2.03 1.2 0 1.96.66 2.96.66.97 0 1.56-.66 2.95-.66 1.05 0 2.17.58 2.96 1.57-2.6 1.43-2.18 5.15.47 6.43z" />
      </svg>
    ),
  },
  {
    id: "google",
    label: "Google",
    mark: (
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.6 12.23c0-.7-.06-1.37-.18-2.02H12v3.82h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.33z"
        />
        <path
          fill="currentColor"
          opacity="0.75"
          d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A10 10 0 0 0 12 22z"
        />
        <path
          fill="currentColor"
          opacity="0.5"
          d="M6.41 13.89a6 6 0 0 1 0-3.78v-2.6H3.07a10 10 0 0 0 0 8.98l3.34-2.6z"
        />
        <path
          fill="currentColor"
          opacity="0.75"
          d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.93 5.51l3.34 2.6C7.2 7.74 9.4 5.96 12 5.96z"
        />
      </svg>
    ),
  },
  {
    id: "azure",
    label: "Microsoft",
    mark: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z" />
      </svg>
    ),
  },
];

// The other ways in.
//
// Wired for real rather than drawn: each button calls signInWithOAuth and
// comes back through /api/auth/callback, which is written and works. What
// is missing is the provider itself — none is enabled in Supabase yet — so
// until one is, a click returns Supabase's own "provider is not enabled"
// and this says so instead of doing nothing. The day a provider is turned
// on in the dashboard, these work with no change here.
//
// See the callback route on why an enabled provider still cannot let a
// stranger in: this space is invitation-only and the door checks.
export function SocialSignIn({ next }: { next?: string }) {
  const [pending, setPending] = useState<ProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (provider: ProviderId) => {
    setPending(provider);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const callback = new URL("/api/auth/callback", window.location.origin);
      if (next) callback.searchParams.set("next", next);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      });

      // On success the browser has already been sent to the provider, so
      // reaching this line at all means it did not happen.
      if (oauthError) {
        setError("Cette connexion n'est pas encore disponible.");
        setPending(null);
      }
    } catch {
      setError("Cette connexion n'est pas encore disponible.");
      setPending(null);
    }
  };

  return (
    <div className="mt-7">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--kov-border)" }} />
        <span className="font-mono text-[9px] uppercase tracking-[0.26em] text-kov-steel">Ou continuer avec</span>
        <span aria-hidden="true" className="h-px flex-1" style={{ background: "var(--kov-border)" }} />
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => void start(provider.id)}
            disabled={pending !== null}
            // The mark alone is not a label. The name is what a screen
            // reader reads out and what a tooltip shows.
            aria-label={`Continuer avec ${provider.label}`}
            title={`Continuer avec ${provider.label}`}
            className="kov-login-social flex h-12 w-12 items-center justify-center rounded-full border text-kov-bone disabled:opacity-50"
            style={{ borderColor: "var(--kov-border)", background: "rgba(255,255,255,0.04)" }}
          >
            {provider.mark}
          </button>
        ))}
      </div>

      {error && (
        <p role="status" className="mt-4 text-center text-xs text-kov-steel">
          {error}
        </p>
      )}
    </div>
  );
}
