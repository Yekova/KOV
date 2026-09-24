"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { login, type LoginState } from "./actions";
import { LoginLoadingOverlay } from "./LoginLoadingOverlay";
import { SocialSignIn } from "./SocialSignIn";

const INITIAL_STATE: LoginState = { error: null };

// A filled field rather than the underline the rest of the site uses.
// Against a photograph an underline is a line on an image; a filled box is
// a thing you can type into, which is what this screen is for.
const FIELD =
  "kov-login-field h-[52px] w-full rounded-xl border bg-white/[0.045] px-4 pr-11 text-[15px] text-kov-bone outline-none placeholder:text-kov-steel/70";

const LABEL = "mb-2 block font-mono text-[9px] uppercase tracking-[0.24em] text-kov-steel";

export function LoginForm({
  next,
  justReset,
  notice,
}: {
  next?: string;
  justReset?: boolean;
  /** A message from the OAuth callback, already resolved to prose by the
   *  page — the component does not know about error codes. */
  notice?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {isPending && <LoginLoadingOverlay />}

      {/* Real refraction, not a blur.
          
          GlassSurface runs an SVG feDisplacementMap over what is behind it,
          with a per-channel offset — the same recipe as the nav pill. It is
          worth its cost here and almost nowhere else: this card sits on a
          photograph of a room with a red light in it, which is exactly the
          kind of backdrop a displacement filter has something to bend.
          
          width/height "auto" so it measures the content rather than being
          stretched by a percentage with nothing definite to resolve
          against — the pill learned that the hard way. */}
      <GlassSurface
        width="auto"
        height="auto"
        borderRadius={26}
        blur={14}
        displace={1.4}
        distortionScale={-160}
        redOffset={2}
        greenOffset={9}
        blueOffset={16}
        backgroundOpacity={0.1}
        saturation={1.2}
        className="kov-login-card w-full max-w-[640px]"
      >
        <div className="w-full p-8 sm:p-11">
        {/* Just the mark. The card sat under an eyebrow, a right-aligned
            greeting and a heading, which is three registers of type before
            the first field — on a page whose only job is one form. */}
        <Image
          src="/kov/brand/kov-wordmark-bone.png"
          alt="KOV"
          width={1116}
          height={209}
          className="mx-auto h-6 w-auto"
          priority
        />

        <span aria-hidden="true" className="mx-auto mt-6 block h-px w-10 bg-kov-red" />

        {notice && (
          <p role="alert" className="mt-7 border-l-2 border-kov-red pl-3 text-sm text-kov-bone">
            {notice}
          </p>
        )}

        {justReset && (
          <p className="mt-7 border-l-2 border-kov-red pl-3 text-sm text-kov-bone">
            Mot de passe mis à jour. Vous pouvez vous connecter.
          </p>
        )}

        <form action={formAction} className="mt-9">
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

        <SocialSignIn next={next} />

        <p className="mt-7 flex items-center justify-center gap-2 text-xs text-kov-steel">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="1.5" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Connexion sécurisée et chiffrée
        </p>
        </div>
      </GlassSurface>
    </>
  );
}
