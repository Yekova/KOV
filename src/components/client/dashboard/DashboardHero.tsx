import Link from "next/link";

// L'en-tête, en 60/40 et sans bord net.
//
// Avant : une photographie en fond plein cadre d'un panneau rectangulaire,
// avec un voile uniforme par-dessus. L'image était donc « une image dans
// une carte » — un rectangle de plus, au même niveau que tous les autres.
//
// Ici elle occupe la droite et se fond dans le noir par un dégradé
// horizontal : il n'y a plus de bord entre le texte et le visuel, donc
// plus de deuxième rectangle. C'est ce qui donne au bloc sa profondeur,
// pas une ombre ajoutée.
//
// ── L'IMAGE VIENT DES DONNÉES QUAND ELLE EXISTE ──────────────────────
//
// Si le projet principal a une vignette, c'est elle. Sinon, le visuel KOV.
// Jamais une image de projet piochée ailleurs : le client reconnaîtrait
// un travail qui n'est pas le sien.

export function DashboardHero({
  fullName,
  imageUrl,
  imageIsProject,
  statusLine,
}: {
  fullName: string | null;
  imageUrl: string;
  imageIsProject: boolean;
  /** Une phrase d'état, dérivée des vraies données. Null si rien de vrai
   *  à dire — auquel cas la ligne disparaît au lieu d'être meublée. */
  statusLine: string | null;
}) {
  const firstName = fullName?.trim().split(" ")[0] ?? null;

  return (
    <section className="kov-panel relative isolate overflow-hidden">
      {/* Le visuel occupe la moitié droite et déborde vers le haut : un
          rectangle exactement aligné sur la grille redeviendrait une carte. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full sm:w-[62%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full select-none object-cover" />
        {/* Le fondu vers la gauche : c'est lui qui supprime le bord. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, var(--kov-surface-1) 0%, rgba(14,16,18,0.92) 26%, rgba(14,16,18,0.45) 62%, rgba(14,16,18,0.2) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(14,16,18,0.35) 0%, transparent 34%, rgba(14,16,18,0.55) 100%)" }}
        />
      </div>

      <div className="relative px-7 py-12 sm:px-10 sm:py-16 lg:max-w-[60%]">
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-kov-concrete">Bonjour</p>

        <h1
          className="mt-4 font-display uppercase text-kov-bone"
          style={{ fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}
        >
          {firstName ?? "Votre espace"}
          <span className="text-kov-red">.</span>
        </h1>

        {/* Le filet rouge : une ligne, pas un halo. */}
        <span aria-hidden="true" className="mt-7 block h-px w-16" style={{ background: "var(--kov-red)" }} />

        {statusLine && <p className="mt-6 max-w-sm text-sm leading-relaxed text-kov-concrete">{statusLine}</p>}

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/client/requests"
            className="inline-flex h-11 items-center gap-2 px-5 text-xs uppercase tracking-widest text-kov-white transition-colors hover:bg-kov-red-signal"
            style={{ borderRadius: "var(--radius-pill)", background: "var(--kov-red)" }}
          >
            Écrire au studio
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/client/projects"
            className="inline-flex h-11 items-center gap-2 border px-5 text-xs uppercase tracking-widest text-kov-bone transition-colors hover:border-kov-bone/40"
            style={{ borderRadius: "var(--radius-pill)", borderColor: "var(--kov-lift-4)" }}
          >
            Mes projets
          </Link>
        </div>

        {imageIsProject && (
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-kov-concrete/60">
            Visuel de votre projet en cours
          </p>
        )}
      </div>
    </section>
  );
}
