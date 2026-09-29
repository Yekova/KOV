import Link from "next/link";
import { LiveClock } from "@/components/ui/LiveClock";

const TODAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

// L'en-tête du portail — plus une carte, et plus d'image.
//
// Il était un panneau de 60/40 avec une photographie fondue à droite. Deux
// choses l'ont rendu caduc.
//
// D'abord l'interface est passée en clair : le fondu de l'image s'appuyait
// sur trois dégradés vers rgba(14,16,18,…), c'est-à-dire vers le noir. Sur
// un fond clair, ils redessinaient exactement le bord net que le fondu
// existait pour supprimer.
//
// Ensuite le visuel de repli était /kov/character/contact-frames : une
// image de marque posée là faute de vignette de projet. Elle n'apportait
// aucune information et occupait la moitié du premier écran.
//
// Ce qui reste est ce qui parlait : le prénom, la ligne d'état dérivée des
// vraies données, et les deux gestes. Même composition que le tableau de
// bord du studio — titre à gauche, heure surdimensionnée à droite.
export function DashboardHero({
  fullName,
  statusLine,
}: {
  fullName: string | null;
  /** Une phrase d'état, dérivée des vraies données. Null si rien de vrai
   *  à dire — auquel cas la ligne disparaît au lieu d'être meublée. */
  statusLine: string | null;
}) {
  const firstName = fullName?.trim().split(" ")[0] ?? null;
  const today = new Date().toLocaleDateString("fr-FR", TODAY_FORMAT);

  return (
    <header className="flex items-end justify-between gap-6 pt-4 pb-8 md:pt-8 md:pb-10">
      <div className="min-w-0">
        <h1
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Bonjour{firstName ? " " : ""}
          {firstName}
          <span className="text-kov-red">.</span>
        </h1>

        <p className="text-kov-steel mt-4 text-sm capitalize">{today}</p>

        {statusLine && <p className="text-kov-concrete mt-5 max-w-md text-sm leading-relaxed">{statusLine}</p>}

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/client/requests"
            className="text-kov-white hover:bg-kov-red-signal inline-flex h-11 items-center gap-2 px-5 text-xs tracking-widest uppercase transition-colors"
            style={{ borderRadius: "var(--radius-pill)", background: "var(--kov-red)" }}
          >
            Écrire au studio
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/client/projects"
            className="text-kov-bone hover:border-kov-red hover:text-kov-red inline-flex h-11 items-center gap-2 border px-5 text-xs tracking-widest uppercase transition-colors"
            style={{ borderRadius: "var(--radius-pill)", borderColor: "var(--kov-border)" }}
          >
            Mes projets
          </Link>
        </div>
      </div>

      <LiveClock className="hidden shrink-0 md:block" />
    </header>
  );
}
