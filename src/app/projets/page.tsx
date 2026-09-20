import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { KovCTA } from "@/components/ui/KovCTA";
import { Reveal } from "@/components/ui/Reveal";
import { PROJECTS } from "@/data/projects";
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

// The work, in full.
//
// The homepage section shows the cards; this page shows the reasoning. It is
// built from the same PROJECTS data, so it can never list a project the rest
// of the site does not know about, and it cannot drift out of date on its
// own.
//
// Two things it deliberately does not do. It does not filter — a category
// filter over two delivered projects is a control with nothing to control.
// And it does not pad: the three unpublished entries appear as an index of
// rows, not as three reserved cards with "Bientôt" in them, because a
// portfolio's worst tell is empty frames dressed up as work.
export default function ProjetsPage() {
  const delivered = PROJECTS.filter((project) => project.status === "live");
  const upcoming = PROJECTS.filter((project) => project.status === "upcoming");

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
    <main id="kov-main" tabIndex={-1} className="min-h-screen px-6 pt-36 pb-32 max-w-[1600px] mx-auto">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* The head used to be a title, a paragraph and a count stacked in a
          column — correct, and completely inert. It is now a spread: the
          statement on the left, and on the right a real table of contents
          that jumps into the page. A work page whose first screen cannot
          name the work on it is a cover, not an opening. */}
      <header className="kov-work-hero">
        <div aria-hidden="true" className="kov-work-hero__grid" />

        <div className="kov-work-hero__cols">
          <Reveal variant="blur">
            <p className="kov-work-eyebrow">
              <span aria-hidden="true" className="kov-work-eyebrow__dot" />
              Réalisations
            </p>

            <h1
              className="kov-work-title"
              style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
            >
              Chaque projet, de bout en bout<span className="text-kov-red">.</span>
            </h1>

            <p className="kov-work-lede">
              Le problème de départ, le système construit pour y répondre, et ce qui a changé. Pas une galerie
              d&apos;images : le raisonnement derrière chaque projet, écrit.
            </p>
          </Reveal>

          <Reveal variant="fade" delay={0.12}>
            <nav className="kov-work-index" aria-label="Sommaire des réalisations">
              <p className="kov-work-index__label">Au sommaire</p>

              <ol className="kov-work-index__list">
                {delivered.map((project) => (
                  <li key={project.id}>
                    <a href={`#projet-${project.id}`} className="kov-work-index__item">
                      <span aria-hidden="true" className="kov-work-index__num">
                        {project.id}
                      </span>
                      <span className="kov-work-index__name">{project.name}</span>
                      <span className="kov-work-index__cat">{project.category}</span>
                      <span aria-hidden="true" className="kov-work-index__arrow">
                        ↓
                      </span>
                    </a>
                  </li>
                ))}
              </ol>

              {/* Counted from the data. A portfolio that says "six projets"
                  above a list of two is the one mistake this page cannot
                  afford, so the number is never typed by hand. */}
              <p className="kov-work-count">
                <span>
                  <b>{String(delivered.length).padStart(2, "0")}</b> en ligne
                </span>
                <span aria-hidden="true">/</span>
                <span>
                  <b>{String(upcoming.length).padStart(2, "0")}</b> à venir
                </span>
              </p>
            </nav>
          </Reveal>
        </div>
      </header>

      <ol className="kov-work-list">
        {delivered.map((project, index) => (
          <Reveal as="li" key={project.id} variant="fade" className="kov-case" id={`projet-${project.id}`}>
            <ProjectCase project={project} index={index} />
          </Reveal>
        ))}
      </ol>

      <Reveal variant="fade">
        <ProjectsUpcoming />
      </Reveal>

      <Reveal variant="blur">
        <section className="kov-work-cta" aria-labelledby="projets-cta">
          <p className="kov-work-eyebrow">
            <span aria-hidden="true" className="kov-work-eyebrow__dot" />
            La suite
          </p>

          <h2 id="projets-cta" className="kov-work-cta__title">
            Le prochain, c&apos;est le vôtre<span className="text-kov-red">.</span>
          </h2>

          <p className="kov-work-cta__lede">
            Dites-nous où vous en êtes. On revient avec une lecture du problème avant de parler de design.
          </p>

          {/* KovCTA `flat` skips ShapeBlur's WebGL halo and Button `ghost` is
              the one variant excluded from the specular effect — so the page
              closes without mounting a single GL context. */}
          <div className="kov-work-cta__actions">
            <KovCTA href="/contact" flat emphasis>
              Démarrer un projet
            </KovCTA>
            <Button href="/studio" variant="ghost">
              Visiter le studio ↗
            </Button>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
