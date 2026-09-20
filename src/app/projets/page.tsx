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
    <main id="kov-main" tabIndex={-1} className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Reveal variant="blur">
        <p className="kov-work-eyebrow">
          <span aria-hidden="true" className="kov-work-eyebrow__dot" />
          Réalisations
        </p>

        <h1
          className="font-display text-kov-bone uppercase max-w-4xl"
          style={{ marginTop: 26, fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Chaque projet, de bout en bout<span className="text-kov-red">.</span>
        </h1>

        <p className="kov-work-lede">
          Le problème de départ, le système construit pour y répondre, et ce qui a changé. Pas une galerie
          d&apos;images : le raisonnement derrière chaque projet, écrit.
        </p>

        {/* Counted from the data. A portfolio that says "six projets" above a
            list of two is the one mistake this page cannot afford, so the
            number is never typed by hand. */}
        <p className="kov-work-count">
          <span>
            <b>{String(delivered.length).padStart(2, "0")}</b> en ligne
          </span>
          <span aria-hidden="true">/</span>
          <span>
            <b>{String(upcoming.length).padStart(2, "0")}</b> à venir
          </span>
        </p>
      </Reveal>

      <ol className="kov-work-list">
        {delivered.map((project, index) => (
          <Reveal as="li" key={project.id} variant="fade" className="kov-case">
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
