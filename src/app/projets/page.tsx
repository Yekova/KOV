import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { KovCTA } from "@/components/ui/KovCTA";
import { ProjectsView } from "@/components/projects/ProjectsView";
import "@/components/projects/ProjectsPage.css";

const SITE_URL = "https://kov-agency.site";

export const metadata: Metadata = {
  title: "Réalisations | KOV",
  description:
    "Les projets livrés par KOV : le problème de départ, le système construit pour y répondre, et ce qui a changé.",
  alternates: { canonical: `${SITE_URL}/projets` },
};

// The work.
//
// Three bands: a masthead, the work, a close. The work itself is a stack of
// full-width rows on hairlines — the number set huge and ghosted at the
// left, the picture in the middle, the field and position at the right —
// and it can be swapped for a plain index at any point.
//
// Quiet on purpose. Almost no colour, generous space, one weight of type.
// Red appears exactly twice on the page: the masthead dash and the active
// dot of a row's rail. Everything else is greys, which is what lets the two
// project pictures be the only things with any saturation on the screen.
//
// Both the homepage section and this page render from PROJECTS, so this page
// cannot list work the rest of the site does not know about. It does not
// filter — a control over two delivered projects controls nothing — and it
// does not pad: unpublished entries are rows in an index, never reserved
// cards with "Bientôt" in them.
export default function ProjetsPage() {
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
    <main id="kov-main" tabIndex={-1} className="kov-pr">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Masthead ──────────────────────────────────────────────────
          Three columns on one line: what this is, what it says, and what
          it covers. A label, a statement and a caption — the whole opening
          in the height of a paragraph, so the work starts near the top of
          the page instead of below a screen of atmosphere. */}
      <header className="kov-pr__head">
        <p className="kov-pr__label">Projets</p>

        <h1 className="kov-pr__title">
          Chaque projet,
          <br />
          de bout en bout<span className="text-kov-red">.</span>
        </h1>

        <p className="kov-pr__lede">
          Le problème de départ, le système construit pour y répondre, et ce qui a changé. Le raisonnement derrière
          chaque projet, pas une galerie d&apos;images.
        </p>
      </header>

      <ProjectsView />

      {/* ── Close ─────────────────────────────────────────────────────
          The same three-column measure as the masthead, so the page opens
          and shuts on the same line. */}
      <footer className="kov-pr__close">
        <p className="kov-pr__label">La suite</p>

        <div className="kov-pr__closeMain">
          <h2 className="kov-pr__closeTitle">
            Et si le prochain projet
            <br />
            c&apos;était le vôtre<span className="text-kov-red"> ?</span>
          </h2>

          <p className="kov-pr__closeLede">
            Dites-nous où vous en êtes. On revient avec une lecture du problème avant de parler de design.
          </p>

          {/* KovCTA `flat` skips ShapeBlur's WebGL halo and Button `ghost`
              is the one variant excluded from the specular effect — so the
              page closes without mounting a GL context. */}
          <div className="kov-pr__closeActions">
            <KovCTA href="/contact" flat emphasis>
              Échanger sur mon projet
            </KovCTA>
            <Button href="/studio" variant="ghost">
              Visiter le studio ↗
            </Button>
          </div>
        </div>

        <p className="kov-pr__triad">
          <span>Concevoir</span>
          <span aria-hidden="true">/</span>
          <span>Développer</span>
          <span aria-hidden="true">/</span>
          <span>Faire grandir</span>
        </p>
      </footer>
    </main>
  );
}
