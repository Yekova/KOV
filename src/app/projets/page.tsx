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
// Three bands — statement, work, invitation — each running the full width of
// the viewport with its own ground, separated by hairlines. <main> carries no
// container of its own; each band pads itself, which is the only way to get a
// band that bleeds to the edge while its content still lines up with every
// other page on the site.
//
// The homepage section shows the cards; this page shows the reasoning. Both
// render from PROJECTS, so this page cannot list work the rest of the site
// does not know about, and it cannot drift out of date on its own.
//
// Two things it deliberately does not do. It does not filter — a category
// control over two delivered projects controls nothing. And it does not pad:
// the unpublished entries are an index of rows, not reserved cards with
// "Bientôt" in them, because a portfolio's worst tell is empty frames dressed
// up as work.
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
    <main id="kov-main" tabIndex={-1} className="kov-work">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Statement ──────────────────────────────────────────────── */}
      <header className="kov-band kov-band--hero">
        {/* Drawn, not photographed. The reference for this page opens on a
            lit planet; nothing of the sort exists in the repository, and a
            stock render would be the one dishonest object on a page whose
            whole argument is that it shows real work. Two gradients and a
            circle get the same light for nothing. */}
        <div aria-hidden="true" className="kov-hero__grid" />
        <div aria-hidden="true" className="kov-hero__body" />
        <div aria-hidden="true" className="kov-hero__streak" />

        <div className="kov-band__inner kov-hero__inner">
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
      </header>

      {/* ── The work ───────────────────────────────────────────────── */}
      <section className="kov-band kov-band--work" aria-label="Projets livrés">
        <div className="kov-band__bleed">
          {/* Spreads alternate sides. The <li> is the band itself, so the
              picture can escape to the viewport edge from inside it. */}
          <ol className="kov-work-list">
            {delivered.map((project, index) => (
              <Reveal
                as="li"
                key={project.id}
                variant="fade"
                className={`kov-dip${index % 2 === 1 ? " kov-dip--flip" : ""}`}
                id={`projet-${project.id}`}
              >
                <ProjectCase project={project} />
              </Reveal>
            ))}
          </ol>

        </div>

        {upcoming.length > 0 && (
          <div className="kov-band__inner">
            <Reveal variant="fade">
              <ProjectsUpcoming />
            </Reveal>
          </div>
        )}
      </section>

      {/* ── Invitation ─────────────────────────────────────────────── */}
      <section className="kov-band kov-band--cta" aria-labelledby="projets-cta">
        <div aria-hidden="true" className="kov-cta__glow kov-cta__glow--left" />
        <div aria-hidden="true" className="kov-cta__glow kov-cta__glow--right" />

        <div className="kov-band__inner kov-cta__inner">
          <Reveal variant="blur">
            <p className="kov-rule-label">Un futur à construire</p>

            <h2 id="projets-cta" className="kov-cta__title">
              Et si le prochain projet
              <br />
              c&apos;était le vôtre<span className="text-kov-red"> ?</span>
            </h2>
          </Reveal>

          <Reveal variant="fade" delay={0.12}>
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
          </Reveal>
        </div>
      </section>
    </main>
  );
}
