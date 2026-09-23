import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PILLARS } from "@/data/expertisePillars";
import { getPillar } from "@/data/expertiseDetail";
import { FAQ } from "@/data/faq";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";

const SITE_URL = "https://kov-agency.site";
/** How many questions a service page carries. Enough to answer the obvious
 *  ones, few enough that the page stays about the service. */
const FAQ_COUNT = 4;

// One page per expertise.
//
// These existed, were deleted, and were 301'd to an anchor on the homepage.
// The redirect has been removed with this route: an anchor cannot rank, own
// a title, or answer a question, and commercial search is a set of
// questions. A visitor typing "refonte site internet" wants a page about
// refonte, not a section of a page about everything.
//
// Statically generated — six known slugs, no database, nothing per-request.

export function generateStaticParams() {
  return PILLARS.map((pillar) => ({ slug: pillar.slug }));
}

export async function generateMetadata(props: PageProps<"/expertise/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const entry = getPillar(slug);
  if (!entry) return {};

  return {
    title: entry.detail.metaTitle,
    description: entry.detail.metaDescription,
    alternates: { canonical: `${SITE_URL}/expertise/${slug}` },
  };
}

export default async function ExpertisePage(props: PageProps<"/expertise/[slug]">) {
  const { slug } = await props.params;
  const entry = getPillar(slug);
  if (!entry) notFound();

  const { pillar, detail } = entry;

  // Drawn from the same fifty answers /faq renders, filtered to what this
  // page is about. One source: an answer corrected there is corrected here.
  //
  // Shown but deliberately not marked up as a FAQPage — /faq carries that,
  // for all fifty, and the same question marked up on two URLs is a
  // duplicate Google has no reason to reward.
  const questions = FAQ.filter((item) => detail.faqCategories.includes(item.category)).slice(0, FAQ_COUNT);

  const others = PILLARS.filter((other) => other.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: pillar.title,
    name: detail.heading,
    description: detail.metaDescription,
    url: `${SITE_URL}/expertise/${slug}`,
    provider: { "@type": "Organization", name: "KOV", url: SITE_URL },
    // France rather than Bordeaux: the studio is in Bordeaux and the work
    // is not limited to it, and claiming a service area narrower than the
    // truth is as wrong as claiming one wider.
    areaServed: { "@type": "Country", name: "France" },
  };

  return (
    <main id="kov-main" tabIndex={-1} className="min-h-screen px-6 pt-28 md:pt-40 pb-20 md:pb-32 max-w-[1100px] mx-auto">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Reveal>
        <p className="flex items-center gap-3 text-xs uppercase tracking-widest text-kov-steel">
          <span aria-hidden="true" className="h-px w-7 bg-kov-red" />
          <Link href="/expertise" className="hover:text-kov-bone transition-colors">
            Expertise
          </Link>
          <span aria-hidden="true" className="opacity-40">/</span>
          {pillar.title}
        </p>

        <h1
          className="mt-7 font-display text-kov-bone max-w-3xl"
          style={{ fontSize: "clamp(32px, 4.4vw, 60px)", lineHeight: 1.08, letterSpacing: "-0.022em" }}
        >
          {detail.heading}
          <span className="text-kov-red">.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-kov-concrete text-lg leading-relaxed">{detail.lede}</p>
      </Reveal>

      <Reveal variant="fade">
        <div className="mt-14 max-w-2xl space-y-6">
          {detail.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="text-kov-steel text-[15px] leading-[1.8]">
              {paragraph}
            </p>
          ))}
        </div>
      </Reveal>

      <Reveal variant="fade">
        <section className="mt-20 border-t pt-14" style={{ borderColor: "var(--kov-border)" }}>
          <h2 className="font-display text-kov-bone uppercase text-xl">Ce que ça recouvre</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-9">
            {detail.covers.map((item) => (
              <div key={item.title}>
                <h3 className="text-kov-bone text-sm font-medium">{item.title}</h3>
                <p className="mt-2 text-kov-steel text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {questions.length > 0 && (
        <Reveal variant="fade">
          <section className="mt-20 border-t pt-14" style={{ borderColor: "var(--kov-border)" }}>
            <h2 className="font-display text-kov-bone uppercase text-xl">Questions fréquentes</h2>
            <dl className="mt-8 space-y-8 max-w-2xl">
              {questions.map((item) => (
                <div key={item.question}>
                  <dt className="text-kov-bone text-sm font-medium">{item.question}</dt>
                  <dd className="mt-2 text-kov-steel text-sm leading-relaxed">{item.answer}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/faq"
              className="mt-8 inline-block text-xs uppercase tracking-widest text-kov-steel hover:text-kov-red transition-colors"
            >
              Toutes les questions →
            </Link>
          </section>
        </Reveal>
      )}

      <Reveal variant="fade">
        <section className="mt-20 border-t pt-14" style={{ borderColor: "var(--kov-border)" }}>
          <h2 className="font-display text-kov-bone uppercase text-xl">Les autres expertises</h2>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 list-none">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={`/expertise/${other.slug}`} className="group block">
                  <span className="font-mono text-[10px] text-kov-red">{other.number}</span>
                  <span className="mt-1 block text-kov-bone text-sm group-hover:text-kov-red transition-colors">
                    {other.title}
                  </span>
                  <span className="mt-1 block text-kov-steel text-xs leading-relaxed">{other.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>

      <Reveal variant="blur">
        <section className="mt-24 text-center">
          <h2
            className="font-display text-kov-bone uppercase mx-auto max-w-[16ch]"
            style={{ fontSize: "clamp(26px, 3.4vw, 44px)", lineHeight: 1.1 }}
          >
            Parlons de votre projet<span className="text-kov-red">.</span>
          </h2>
          <p className="mt-6 mx-auto max-w-lg text-kov-steel text-sm leading-relaxed">
            Dites-nous où vous en êtes. On revient avec une lecture du problème avant de parler design.
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
