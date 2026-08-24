import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SERVICES } from "@/data/services";
import { PILLARS } from "@/data/expertisePillars";

const SITE_URL = "https://kov-agency.site";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

function getService(slug: string) {
  return SERVICES.find((service) => service.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "Expertise — KOV" };
  return {
    title: `${service.title} — KOV`,
    description: service.description,
    alternates: { canonical: `${SITE_URL}/expertise/${service.slug}` },
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const focusPillars = PILLARS.filter((pillar) => (service.focus as readonly string[]).includes(pillar.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: { "@type": "Organization", name: "KOV", url: SITE_URL },
    areaServed: "FR",
    url: `${SITE_URL}/expertise/${service.slug}`,
  };

  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">
        <Link href="/expertise" className="hover:text-kov-red transition-colors">
          Expertise
        </Link>{" "}
        / {service.title}
      </p>

      <h1
        className="font-display text-kov-bone uppercase max-w-4xl"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        {service.tagline}
      </h1>

      <p className="mt-10 max-w-2xl text-kov-concrete text-sm leading-relaxed">{service.description}</p>

      {focusPillars.length > 0 && (
        <section className="mt-24 border-t pt-10" style={{ borderColor: "var(--kov-border)" }}>
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-6">Disciplines impliquées</p>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            {focusPillars.map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/expertise#${pillar.slug}`}
                className="text-kov-bone text-sm uppercase tracking-widest hover:text-kov-red transition-colors"
              >
                {pillar.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-32">
        <Button href="/contact" variant="primary">
          Démarrer un projet →
        </Button>
      </div>
    </main>
  );
}
