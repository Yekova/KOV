import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { KovCTA } from "@/components/ui/KovCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PROJECTS } from "@/data/projects";
import { ChapterRail, type Chapter } from "@/components/projects/ChapterRail";
import { ProjectCase } from "@/components/projects/ProjectCase";
import { ProjectsUpcoming } from "@/components/projects/ProjectsUpcoming";
import "@/components/projects/ProjectsPage.css";

const SITE_URL = "https://kov-agency.site";

export const metadata: Metadata = {
  title: "Réalisations | KOV",
  description:
    "Les projets livrés par KOV : le problème de départ, le système construit pour y répondre, et ce qui a changé.",
  alternates: { canonical: `${SITE_URL}/projets` },
};

// The work, one screen at a time.
//
// The page is a set of chapters rather than a scroll: the statement, one
// screen per project, and the close. Each fills the viewport above 1024px,
// the ground steps very slightly between them, and a rail down the left edge
// says which one you are in and lets you skip.
//
// No scroll-snap. This site runs Lenis, and CSS snapping fights an inertia
// scroller that is animating scrollTop itself — the chapters are a visual
// rhythm, not a carousel that grabs the wheel.
//
// Below 1024px the chapters give up their height and the page becomes an
// ordinary stack. A project with a window, a name and three narrative rows
// does not fit in a phone viewport, and forcing it to would mean cutting the
// part that matters.
//
// Both the homepage section and this page render from PROJECTS, so this page
// cannot list work the rest of the site does not know about. It does not
// filter — a category control over two delivered projects controls nothing —
// and it does not pad: unpublished entries are an index of rows, never
// reserved cards with "Bientôt" in them.
export default function ProjetsPage() {
  const delivered = PROJECTS.filter((project) => project.status === "live");
  const upcoming = PROJECTS.filter((project) => project.status === "upcoming");

  const chapters: Chapter[] = [
    { id: "ch-intro", label: "Introduction" },
    ...delivered.map((project) => ({ id: `projet-${project.id}`, label: project.name })),
    { id: "ch-suite", label: "La suite" },
  ];

  // Truthful and minimal: what the page is, not what is on it. No dates, no
  // authorship, no per-project claims — none of that is recorded anywhere,
  // and structured data is the last place to start inventing it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Réalisations | KOV",
    description: metadata.description,
    url: `${SITE_URL}/projets`,
  };

  return (
    <main id="kov-main" tabIndex={-1} className="kov-work">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ChapterRail chapters={chapters} />

      {/* ── Chapter 1 — the statement ──────────────────────────────── */}
      <section id="ch-intro" className="kov-ch kov-ch--intro">
        {/* Drawn, not photographed. Nothing like this exists in the
            repository, and a stock render would be the one dishonest object
            on a page whose whole argument is that it shows real work. */}
        <div aria-hidden="true" className="kov-hero__grid" />
        <div aria-hidden="true" className="kov-hero__body" />
        <div aria-hidden="true" className="kov-hero__streak" />

        <div className="kov-ch__inner">
          <Reveal variant="blur">
            <p className="kov-rule-label">Projets</p>

            <h1 className="kov-hero__title">
              Chaque projet,
              <br />
              de bout en bout<span className="text-kov-red">.</span>
            </h1>

            <p className="kov-hero__lede">
              Le problème de départ, le système construit pour y répondre, et ce qui a changé. Pas une galerie
              d&apos;images : le raisonnement derrière chaque projet.
            </p>

            <p className="kov-hero__triad">
              <span aria-hidden="true" className="kov-hero__triad-rule" />
              <span>Concevoir</span>
              <span aria-hidden="true">|</span>
              <span>Développer</span>
              <span aria-hidden="true">|</span>
              <span>Faire grandir</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── One chapter per delivered project ──────────────────────── */}
      {delivered.map((project, index) => (
        <section
          key={project.id}
          id={`projet-${project.id}`}
          className={`kov-ch kov-ch--work${index % 2 === 1 ? " is-alt" : ""}`}
        >
          <div className="kov-ch__inner">
            <Reveal variant="fade" className={`kov-vit${index % 2 === 1 ? " kov-vit--flip" : ""}`}>
              <ProjectCase project={project} />
            </Reveal>
          </div>
        </section>
      ))}

      {/* ── Last chapter — what is coming, and the invitation ──────── */}
      <section id="ch-suite" className="kov-ch kov-ch--close" aria-labelledby="projets-cta">
        <div aria-hidden="true" className="kov-cta__glow kov-cta__glow--left" />
        <div aria-hidden="true" className="kov-cta__glow kov-cta__glow--right" />

        <div className="kov-ch__inner kov-close">
          {upcoming.length > 0 && (
            <Reveal variant="fade">
              <ProjectsUpcoming />
            </Reveal>
          )}

          <Reveal variant="blur" delay={0.1}>
            <div className="kov-close__cta">
              <div>
                <p className="kov-rule-label">Un futur à construire</p>

                <h2 id="projets-cta" className="kov-cta__title">
                  Et si le prochain projet
                  <br />
                  c&apos;était le vôtre<span className="text-kov-red"> ?</span>
                </h2>
              </div>

              <div className="kov-cta__aside">
                <p className="kov-cta__lede">
                  Dites-nous où vous en êtes. On revient avec une lecture du problème avant de parler de design.
                </p>

                {/* KovCTA `flat` skips ShapeBlur's WebGL halo and Button
                    `ghost` is the one variant excluded from the specular
                    effect — so the page closes without mounting a GL
                    context. */}
                <div className="kov-cta__actions">
                  <KovCTA href="/contact" flat emphasis>
                    Échanger sur mon projet
                  </KovCTA>
                  <Button href="/studio" variant="ghost">
                    Visiter le studio ↗
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
