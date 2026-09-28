import Link from "next/link";

// L'en-tête du tableau de bord.
//
// La recherche en est partie : elle vit dans la barre du haut, donc sur
// chaque écran (voir PortalSearch). Ce qui reste est ce qu'un en-tête doit
// faire — dire qui est connecté, et ouvrir les trois portes qu'on pousse le
// plus souvent.
//
// Les trois actions sont des routes réelles. Rien ici n'annonce une
// fonction que l'espace n'a pas.

const ACTIONS = [
  { label: "Écrire au studio", href: "/client/requests", primary: true },
  { label: "Mes projets", href: "/client/projects", primary: false },
  { label: "Mes documents", href: "/client/documents", primary: false },
];

export function DashboardHero({ fullName }: { fullName: string | null }) {
  const firstName = fullName?.trim().split(" ")[0] ?? null;

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{ borderRadius: "var(--radius-glass)", border: "1px solid var(--glass-border)" }}
    >
      {/* La photographie et son voile. Le voile est plus dense à gauche,
          là où le texte se pose, et laisse la lumière de l'image à droite —
          sans quoi la photo n'aurait aucune raison d'être là. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kov/character/contact-frames/frame-040.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full select-none object-cover"
        style={{ objectPosition: "75% center" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.82) 42%, rgba(10,10,10,0.35) 100%), linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.55) 100%)",
        }}
      />

      <div className="px-7 py-10 sm:px-10 sm:py-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-kov-red">Bonjour</p>

        <h1
          className="mt-3 font-display uppercase text-kov-bone"
          style={{ fontSize: "clamp(28px, 4vw, 52px)", lineHeight: 1.04, letterSpacing: "-0.025em" }}
        >
          {firstName ?? "Votre espace"}
          <span className="text-kov-red">.</span>
        </h1>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-kov-concrete">
          Voici où en sont vos projets. Le studio met cette page à jour au fil du travail.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex h-11 items-center gap-2 px-5 text-xs uppercase tracking-widest transition-colors"
              style={
                action.primary
                  ? {
                      borderRadius: "var(--radius-pill)",
                      background: "var(--kov-red)",
                      color: "var(--kov-white)",
                    }
                  : {
                      borderRadius: "var(--radius-pill)",
                      border: "1px solid var(--kov-border)",
                      color: "var(--kov-bone)",
                      background: "rgba(255,255,255,0.03)",
                    }
              }
            >
              {action.label}
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
