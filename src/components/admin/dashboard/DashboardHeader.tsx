import { LiveClock } from "@/components/ui/LiveClock";

const TODAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

// L'en-tête du tableau de bord.
//
// Ce n'est plus une carte. C'en était une — une GlassCard de 8 à 10 de
// padding — donc le premier élément de la page était un cadre, et le
// second une rangée de six cadres. Une page qui commence par deux étages
// de boîtes n'a pas de hiérarchie : tout y a le même poids.
//
// Le titre est maintenant l'adresse elle-même, posée sur le fond. « Vue
// d'ensemble » a disparu : il nommait la page dans une interface où la
// navigation le dit déjà, et il prenait la place du seul mot qui
// s'adresse à quelqu'un.
//
// L'heure est un ornement typographique : surdimensionnée, à 7 %
// d'opacité, elle donne son échelle au bloc sans rien réclamer. Elle est
// masquée aux lecteurs d'écran (voir LiveClock) — la lire au milieu du
// titre ne rendrait service à personne.
export function DashboardHeader({ fullName }: { fullName: string | null }) {
  const today = new Date().toLocaleDateString("fr-FR", TODAY_FORMAT);
  const firstName = fullName?.trim().split(" ")[0] ?? null;

  return (
    <header className="relative flex items-end justify-between gap-6 pt-6 pb-10 md:pt-10 md:pb-14">
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
      </div>

      {/* Masquée sous md : à cette largeur elle passerait sous le titre ou
          le pousserait, alors qu'elle n'est là que pour l'accompagner. */}
      <LiveClock className="hidden shrink-0 md:block" />
    </header>
  );
}
