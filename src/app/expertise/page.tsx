import type { Metadata } from "next";
import Link from "next/link";
import { PILLARS } from "@/data/expertisePillars";
import { PILLAR_DETAILS } from "@/data/expertiseDetail";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";

const SITE_URL = "https://kov-agency.site";

export const metadata: Metadata = {
  title: "Expertise — création et refonte de sites internet | KOV",
  description:
    "Stratégie, design, développement, motion, systèmes et intégration. Les six métiers avec lesquels KOV construit un site, et ce que chacun recouvre.",
  alternates: { canonical: `${SITE_URL}/expertise` },
};

// The hub the six service pages hang from.
//
// It is not a duplicate of the homepage's #expertise sequence: that one is a
// moment in a scroll, built to be seen. This one is built to be read and to
// be entered from a search result, which is a different job and needs its
// own URL, title and description.
export default function ExpertiseHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Expertise | KOV",
    description: metadata.description,
    url: `${SITE_URL}/expertise`,
    hasPart: PILLAR_DETAILS.map((detail) => ({
      "@type": "Service",
      serviceType: PILLARS.find((pillar) => pillar.slug === detail.slug)?.title,
      name: detail.heading,
      url: `${SITE_URL}/expertise/${detail.slug}`,
    })),
  };

  return (
    <main id="kov-main" tabIndex={-1} className="min-h-screen px-6 pt-28 md:pt-40 pb-20 md:pb-32 max-w-[1100px] mx-auto">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Reveal>
        <p className="flex items-center gap-3 text-xs uppercase tracking-widest text-kov-steel">
          <span aria-hidden="true" className="h-px w-7 bg-kov-red" />
          Expertise
        </p>

        <h1
          className="mt-7 font-display text-kov-bone max-w-3xl"
          style={{ fontSize: "clamp(32px, 4.8vw, 64px)", lineHeight: 1.08, letterSpacing: "-0.022em" }}
        >
          Six métiers, un seul site
          <span className="text-kov-red">.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-kov-concrete text-lg leading-relaxed">
          Un site qui tient ne vient pas d&apos;une compétence mais de six, tenues ensemble. Voici ce que chacune
          recouvre, et ce qu&apos;elle décide.
        </p>

        <p className="mt-5 max-w-2xl text-kov-steel text-sm leading-relaxed">
          Vous cherchez plutôt à savoir ce que recouvre un projet et comment il se déroule ? Commencez par la{" "}
          <Link href="/creation-site-internet" className="text-kov-red hover:text-kov-bone transition-colors underline underline-offset-2">
            création de site internet
          </Link>
          .
        </p>
      </Reveal>

      <Reveal variant="fade">
        <ul className="mt-16 list-none border-t" style={{ borderColor: "var(--kov-border)" }}>
          {PILLARS.map((pillar) => {
            const detail = PILLAR_DETAILS.find((entry) => entry.slug === pillar.slug);
            return (
              <li key={pillar.slug} className="border-b" style={{ borderColor: "var(--kov-border)" }}>
                <Link
                  href={`/expertise/${pillar.slug}`}
                  className="group grid grid-cols-1 md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1.5fr)_2rem] gap-x-8 gap-y-2 py-9 items-baseline"
                >
                  <span className="font-mono text-[11px] text-kov-red">{pillar.number}</span>
                  <h2 className="font-display text-kov-bone text-xl group-hover:text-kov-red transition-colors">
                    {pillar.title}
                  </h2>
                  <span className="text-kov-steel text-sm leading-relaxed">{detail?.lede ?? pillar.tagline}</span>
                  <span
                    aria-hidden="true"
                    className="hidden md:block text-kov-steel group-hover:text-kov-red transition-colors text-right"
                  >
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Reveal>

      <Reveal variant="blur">
        <section className="mt-24 text-center">
          <h2
            className="font-display text-kov-bone uppercase mx-auto max-w-[16ch]"
            style={{ fontSize: "clamp(26px, 3.4vw, 44px)", lineHeight: 1.1 }}
          >
            Par où commencer<span className="text-kov-red"> ?</span>
          </h2>
          <p className="mt-6 mx-auto max-w-lg text-kov-steel text-sm leading-relaxed">
            Par le problème, pas par la prestation. Dites-nous où vous en êtes et on vous dira ce que ça demande.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <KovCTA href="/contact" flat emphasis>
              Échanger sur mon projet
            </KovCTA>
            <Button href="/projets" variant="ghost">
              Voir nos réalisations
            </Button>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
