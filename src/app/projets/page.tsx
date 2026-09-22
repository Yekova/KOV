import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { KovCTA } from "@/components/ui/KovCTA";
import { LiquidReveal } from "@/components/projects/LiquidReveal";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { fetchShowcaseProjects } from "@/lib/showcase/projects";
import "@/components/projects/ProjectsPage.css";

const SITE_URL = "https://kov-agency.site";

export const metadata: Metadata = {
  title: "Réalisations | KOV",
  description:
    "Les dernières créations de sites internet signées KOV : ce qui a été livré sur chaque projet, et ce que ça a changé.",
  alternates: { canonical: `${SITE_URL}/projets` },
};

// The work.
//
// A centred statement, then a grid of light cards on the page's own black —
// each a browser window over a block of text: what was built, the name, the
// place, and what changed. The cards are the only light objects on the
// page, which is the move the homepage's own project cards already make and
// the reason two of them read as a set rather than as a short list.
//
// Both the homepage section and this page render from PROJECTS, so this page
// cannot list work the rest of the site does not know about. It does not
// filter — a control over two delivered projects controls nothing.
//
// It does list what is coming, which it did not before: a named project in
// progress carries a description and no result, and the unnamed positions
// collapse to a single reserved card. Three identical "À venir" tiles would
// be padding; one is a roadmap with a place in it.
// The page reads a table now, so it must not be baked once at build time.
// /journal carries the scar from exactly that mistake; sixty seconds is the
// window it settled on, and the admin's own actions call revalidatePath on
// top of it for an instant update.
export const revalidate = 60;

export default async function ProjetsPage() {
  const projects = await fetchShowcaseProjects();

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
    <main id="kov-main" tabIndex={-1} className="kov-pw">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* The page's ground. Fixed behind everything below, and invisible
          until the cursor moves across it. */}
      <LiquidReveal />

      <header className="kov-pw__head">
        <p className="kov-pw__label">
          <span aria-hidden="true" />
          Réalisations
        </p>

        <h1 className="kov-pw__title">
          Nos dernières créations
          <br />
          de sites internet<span className="text-kov-red">.</span>
        </h1>

        <p className="kov-pw__lede">
          Ce qui a été livré sur chaque projet, et ce que ça a changé — puis ce qui arrive. Le raisonnement derrière
          le travail, pas une galerie d&apos;images.
        </p>
      </header>

      <ProjectsView projects={projects} />

      <footer className="kov-pw__close">
        <h2 className="kov-pw__closeTitle">
          Et si le prochain projet
          <br />
          c&apos;était le vôtre<span className="text-kov-red"> ?</span>
        </h2>

        <p className="kov-pw__closeLede">
          Dites-nous où vous en êtes. On revient avec une lecture du problème avant de parler de design.
        </p>

        {/* KovCTA `flat` skips ShapeBlur's WebGL halo and Button `ghost` is
            the one variant excluded from the specular effect — so the page
            closes without mounting a GL context. */}
        <div className="kov-pw__closeActions">
          <KovCTA href="/contact" flat emphasis>
            Échanger sur mon projet
          </KovCTA>
          <Button href="/studio" variant="ghost">
            Visiter le studio ↗
          </Button>
        </div>
      </footer>
    </main>
  );
}
