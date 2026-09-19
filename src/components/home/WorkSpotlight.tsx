import type { LucideIcon } from "lucide-react";
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
import { KovCTA } from "@/components/ui/KovCTA";
import { Reveal } from "@/components/ui/Reveal";
import { SectionVeil } from "@/components/home/SectionVeil";
import "./WorkSpotlight.css";

interface Brick {
  Icon: LucideIcon;
  title: string;
  body: string;
}

interface Axis {
  key: string;
  label: string;
  claim: string;
  bricks: Brick[];
}

// The ten capabilities, grouped under the four axes the lead block names.
//
// The grouping is the whole idea, and the reason this is no longer ten equal
// tiles: ten equal cards is a list, and a list says these are ten separate
// things you could buy. Four axes with their own bricks says they are one
// system doing four jobs — which is the sentence the section exists to make.
//
// The grouping is also load-bearing for the layout. The two axes carrying
// three bricks take the wider column on their row, so the composition is
// asymmetric because the content is, not because asymmetry looks designed.
const AXES: Axis[] = [
  {
    key: "image",
    label: "Image",
    claim: "Ce qu'on retient de vous.",
    bricks: [
      { Icon: Palette, title: "Direction artistique", body: "Une identité claire, cohérente et mémorable." },
      { Icon: Orbit, title: "Motion utile", body: "Des interactions au service du message." },
    ],
  },
  {
    key: "structure",
    label: "Structure",
    claim: "Ce qui tient debout.",
    bricks: [
      { Icon: LayoutGrid, title: "UX & architecture", body: "Un parcours lisible, pensé pour convertir." },
      { Icon: CodeXml, title: "Développement", body: "Du code propre, rapide et prêt à évoluer." },
      { Icon: MonitorSmartphone, title: "Responsive", body: "Une expérience fluide sur tous les écrans." },
    ],
  },
  {
    key: "performance",
    label: "Performance",
    claim: "Ce qui se mesure.",
    bricks: [
      { Icon: Search, title: "SEO technique", body: "Une structure que les moteurs lisent correctement." },
      { Icon: ChartLine, title: "Analytics", body: "Des décisions guidées par ce qui se passe vraiment." },
    ],
  },
  {
    key: "autonomie",
    label: "Autonomie",
    claim: "Ce qui vous reste.",
    bricks: [
      { Icon: PenLine, title: "CMS / autonomie", body: "Vous gardez la main sur vos contenus." },
      { Icon: Plug, title: "Intégrations", body: "Relié à vos outils, pas isolé à côté d'eux." },
      { Icon: LifeBuoy, title: "Accompagnement", body: "La mise en ligne n'est pas la fin du projet." },
    ],
  },
];

const TOTAL_BRICKS = AXES.reduce((n, axis) => n + axis.bricks.length, 0);
const MAX_BRICKS = Math.max(...AXES.map((axis) => axis.bricks.length));

// One axis: a head, a claim, then its bricks as rows.
function AxisPanel({ axis }: { axis: Axis }) {
  return (
    <div className="kov-sys-axis">
      <div className="kov-sys-axis__head">
        <span className="kov-sys-axis__label">{axis.label}</span>
        <span aria-hidden="true" className="kov-sys-axis__rule" />
        {/* A real count. The only figures anywhere in this section are counts
            of what is drawn directly beneath them — nothing here is a claim
            about results that cannot be checked. */}
        <span aria-hidden="true" className="kov-sys-axis__count">
          {String(axis.bricks.length).padStart(2, "0")}
        </span>
      </div>
      <p className="kov-sys-axis__claim">{axis.claim}</p>

      <ul className="kov-sys-bricks">
        {axis.bricks.map((brick) => (
          <li key={brick.title} className="kov-sys-brick">
            <span aria-hidden="true" className="kov-sys-brick__ico">
              <brick.Icon size={16} strokeWidth={1.6} />
            </span>
            <span className="kov-sys-brick__text">
              <span className="kov-sys-brick__title">{brick.title}</span>
              <span className="kov-sys-brick__body">{brick.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// "On ne livre pas un site, on construit un système."
//
// Editorial column on the left, the system itself on the right: a lead block
// naming the four axes, the four axes with their bricks, then the invitation.
// A map of an offer rather than a listing of it — which is why it has a
// centre and edges instead of a uniform pitch.
//
// Stays a Server Component. The hover states are group-hover:, which is CSS,
// and the entrance is Reveal's IntersectionObserver — no state, no animation
// library, nothing that needs a client boundary.
export function WorkSpotlight() {
  return (
    <section id="spotlight" className="relative px-6 py-32 max-w-[1600px] mx-auto scroll-mt-40">
      {/* Black ground with a cursor-lit hole in it — see SectionVeil. The
          content below must stay inside its own `relative` wrapper, or the
          veil paints over it. */}
      <SectionVeil />
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,34fr)_minmax(0,66fr)] gap-14 lg:gap-16 xl:gap-20">
          {/* ── Editorial column ─────────────────────────────────────── */}
          <Reveal variant="blur">
            <div className="lg:sticky lg:top-32">
              <p className="kov-sys-eyebrow">
                <span aria-hidden="true" className="kov-sys-eyebrow__dot" />
                Ce qu&apos;on construit
              </p>

              <h2 className="kov-sys-title">
                Pas juste un site.
                <br />
                <span className="text-kov-red">Un système digital.</span>
              </h2>

              <p className="kov-sys-lede">
                Chaque projet combine direction artistique, structure, développement, performance et autonomie. Le
                résultat n&apos;est pas une page isolée, mais un environnement cohérent, pensé pour durer.
              </p>

              <div aria-hidden="true" className="kov-sys-sep" />

              <p className="kov-sys-triad">
                <span>Stratégie</span>
                <span aria-hidden="true" className="kov-sys-triad__x">
                  ×
                </span>
                <span>Création</span>
                <span aria-hidden="true" className="kov-sys-triad__x">
                  ×
                </span>
                <span>Technologie</span>
              </p>
              <p className="kov-sys-note">Un tout, pas des morceaux.</p>
            </div>
          </Reveal>

          {/* ── The system ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 lg:gap-5">
            {/* Lead block. It names the four axes the panels below are
                grouped by, so the composition explains its own structure
                before anyone has to infer it. */}
            <Reveal variant="fade">
              <div className="kov-sys-lead">
                <div className="kov-sys-lead__head">
                  <div className="min-w-0">
                    <p className="kov-sys-lead__kicker">Le système</p>
                    <h3 className="kov-sys-lead__title">
                      Quatre axes, {TOTAL_BRICKS} briques, un seul ensemble.
                    </h3>
                  </div>
                  <span aria-hidden="true" className="kov-sys-lead__index">
                    {String(AXES.length).padStart(2, "0")} / {TOTAL_BRICKS}
                  </span>
                </div>

                <ul className="kov-sys-strip">
                  {AXES.map((axis, i) => (
                    <li key={axis.key} className="kov-sys-strip__item">
                      <span aria-hidden="true" className="kov-sys-strip__num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="kov-sys-strip__label">{axis.label}</span>
                      {/* The one chart in the section, and it plots something
                          real: this axis's share of the bricks, all of which
                          are drawn a block below. */}
                      <span
                        aria-hidden="true"
                        className="kov-sys-strip__bar"
                        style={{ ["--fill" as string]: `${(axis.bricks.length / MAX_BRICKS) * 100}%` }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Two rows of two, wider column to the axis carrying more. */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-4 lg:gap-5">
              <Reveal variant="fade" delay={0.05}>
                <AxisPanel axis={AXES[0]} />
              </Reveal>
              <Reveal variant="fade" delay={0.1}>
                <AxisPanel axis={AXES[1]} />
              </Reveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-4 lg:gap-5">
              <Reveal variant="fade" delay={0.15}>
                <AxisPanel axis={AXES[2]} />
              </Reveal>
              <Reveal variant="fade" delay={0.2}>
                <AxisPanel axis={AXES[3]} />
              </Reveal>
            </div>

            <Reveal variant="fade" delay={0.25}>
              <div className="kov-sys-cta">
                <div className="min-w-0">
                  <p className="kov-sys-cta__title">Construisons un système qui vous ressemble.</p>
                  <p className="kov-sys-cta__body">
                    Chaque projet est différent. Le système que nous construisons aussi.
                  </p>
                </div>
                {/* `flat` skips KovCTA's ShapeBlur halo, so this adds no WebGL
                    context to a page already running LineWaves. */}
                <KovCTA href="/contact" flat emphasis className="shrink-0">
                  Démarrer un projet
                </KovCTA>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
