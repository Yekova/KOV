import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { MouseFrameBackdrop } from "@/components/ui/MouseFrameBackdrop";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Connexion — KOV",
  description: "Connexion à l'espace client ou admin KOV.",
};

// Must match the number of frames actually extracted into public/kov/character/login-frames/.
const LOGIN_FRAME_COUNT = 60;

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const nextParam = searchParams.next;
  const next = typeof nextParam === "string" ? nextParam : undefined;
  const justReset = searchParams.reset === "success";

  return (
    <main className="min-h-screen relative" style={{ background: "var(--kov-black)" }}>
      <MouseFrameBackdrop
        basePath="/kov/character/login-frames"
        frameCount={LOGIN_FRAME_COUNT}
        poster={`/kov/character/login-frames/frame-${String(Math.floor(LOGIN_FRAME_COUNT / 2)).padStart(3, "0")}.jpg`}
      />

      <div className="relative min-h-screen max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-16 px-6 md:px-16 py-24">
        <div className="hidden md:block max-w-xs">
          <p className="text-kov-red text-xs uppercase tracking-widest mb-6">Espace sécurisé</p>
          <h1
            className="font-display text-kov-bone uppercase"
            style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
          >
            VOTRE PROJET,
            <br />
            UN ESPACE
            <br />
            SÉCURISÉ<span className="text-kov-red">.</span>
          </h1>
          <p className="text-kov-steel mt-8 text-sm leading-relaxed">
            Connexion réservée aux clients et à l&apos;équipe KOV — suivi de projet et échanges centralisés.
          </p>

          <GlassCard className="mt-12 flex items-start gap-4 p-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-kov-red shrink-0 mt-0.5"
            >
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <div>
              <p className="text-kov-bone text-xs uppercase tracking-widest">Vos données, notre engagement</p>
              <p className="text-kov-steel text-xs mt-1.5 leading-relaxed">
                Hébergement sécurisé dans l&apos;UE (Irlande). Connexion chiffrée de bout en bout.
              </p>
            </div>
          </GlassCard>
        </div>

        <div className="w-full max-w-md">
          <p className="font-display text-kov-bone text-lg tracking-widest mb-8 md:hidden text-center">KOV</p>
          <LoginForm next={next} justReset={justReset} />
        </div>
      </div>
    </main>
  );
}
