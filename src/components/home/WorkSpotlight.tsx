import {
  ChartLine,
  CodeXml,
  LayoutGrid,
  LifeBuoy,
  MonitorSmartphone,
  Orbit,
  Palette,
  PenLine,
  Plug,
  Search,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

// Icons live alongside the copy rather than in src/data — data files in this
// repo are pure .ts with no JSX, so moving these out would force an
// icon-name→component map for no gain. Same call ExpertiseTeaser's VISUALS
// already makes. Icon names verified against the installed lucide-react@1.38
// (Code2 and LineChart do not exist in this major).
//
// Every line is deliberately figure-free: this section describes what is
// built, and there is no measured number in this product that could honestly
// qualify any of it.
const MODULES = [
  { Icon: Palette, title: "Direction artistique", body: "Une identité qui vous appartient, pas un thème repeint.", span: 2 },
  { Icon: LayoutGrid, title: "UX & architecture", body: "Une structure où l'on trouve sans chercher.", span: 1 },
  { Icon: CodeXml, title: "Développement", body: "Du code de production, pas une maquette animée.", span: 1 },
  { Icon: MonitorSmartphone, title: "Responsive", body: "Pensé pour le mobile dès la première maquette.", span: 1 },
  { Icon: Orbit, title: "Motion", body: "Du mouvement là où il explique quelque chose.", span: 1 },
  { Icon: Search, title: "SEO technique", body: "Un site que les moteurs lisent correctement.", span: 1 },
  { Icon: ChartLine, title: "Analytics", body: "Comprendre ce qui fonctionne après le lancement.", span: 1 },
  { Icon: PenLine, title: "CMS / autonomie", body: "Modifier vos contenus sans dépendre de nous.", span: 1 },
  { Icon: Plug, title: "Intégrations", body: "Relié à vos outils, pas isolé à côté d'eux.", span: 1 },
  { Icon: LifeBuoy, title: "Accompagnement", body: "La mise en ligne n'est pas la fin du projet.", span: 2 },
] as const;

// What you actually get. Placed after #process on purpose: the visitor has
// just been reassured about how a project runs, and this answers the question
// that follows — what is in it.
//
// One chassis, ten bays. The gaps in the grid ARE the rules: a 1px gap over a
// --kov-border background draws continuous hairlines between semi-transparent
// bays, so the panel reads as one machined object rather than ten cards. That
// distinction is the whole brief for this section — a card grid here is a
// pricing checklist, which it must not be.
//
// No backdrop-filter on the chassis: it is a large element sitting over an
// already-running WebGL shader (LineWaves), and glass is meant to be a
// punctual layer, not a section-wide default. Tint + border + hairlines give
// the same lightness for no per-frame GPU cost.
//
// Stays a Server Component — the hover is group-hover: and needs no state.
export function WorkSpotlight() {
  return (
    <section id="spotlight" className="px-6 py-32 max-w-[1600px] mx-auto scroll-mt-40">
      <Reveal variant="blur">
        <SectionHeading
          eyebrow="Ce que vous obtenez"
          title={
            <>
              Pas juste
              <br />
              un site<span className="text-kov-red">.</span>
            </>
          }
          lede="Un système digital pensé pour votre marque et votre croissance."
        />
      </Reveal>

      {/* One Reveal around the whole chassis, not ten staggered ones. A
          system that arrives in ten pieces isn't one — and a Reveal per <li>
          would put a transform on each grid item and fight the col-spans
          that bookend the layout. */}
      <Reveal variant="fade">
        <div
          className="mt-20 overflow-hidden"
          style={{ border: "1px solid var(--kov-border)", borderRadius: "var(--radius-glass)" }}
        >
          {/* 2+1+3+3+1+2 = 12 units = exactly 4 rows at lg, bookended by the
              two widest bays. No filler cell, no hole. */}
          <ul
            className="list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: 1, background: "var(--kov-border)" }}
          >
            {MODULES.map(({ Icon, title, body, span }) => (
              <li
                key={title}
                className={`group flex items-start gap-4 p-6 lg:p-8 transition-colors duration-300 ${
                  span === 2 ? "sm:col-span-2" : ""
                }`}
                style={{ background: "rgba(10,10,10,0.55)" }}
              >
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="shrink-0 mt-0.5 text-kov-steel group-hover:text-kov-red transition-colors duration-300"
                />
                <div className="min-w-0">
                  <h3 className="text-kov-bone text-sm uppercase tracking-wide">{title}</h3>
                  <p className="text-kov-steel text-xs leading-relaxed mt-1.5">{body}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* The closing line as a footer bay rather than loose text below:
              it gives the panel a base and keeps it a single object. */}
          <p
            className="px-6 lg:px-8 py-7 text-kov-concrete text-sm leading-relaxed"
            style={{ borderTop: "1px solid var(--kov-border)", background: "rgba(10,10,10,0.55)" }}
          >
            Chaque projet est différent. Le système que nous construisons aussi.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
