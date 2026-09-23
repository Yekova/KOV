import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/data/faq";
import { getBusinessInfo } from "@/lib/billing/businessInfo";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";

const SITE_URL = "https://kov-agency.site";
const FAQ_COUNT = 4;

// The local page.
//
// "Agence web Bordeaux" and "création de site internet Bordeaux" are far
// less contested than the national head term, and the intent behind them is
// much stronger: someone typing a city wants to meet a person, not read a
// definition. That is the realistic way in, and it is why this page exists
// separately from /creation-site-internet rather than as a paragraph in it.
//
// It claims nothing about the local market it cannot support. No count of
// Bordeaux clients, no list of neighbourhoods nobody worked in, no "agence
// n°1" of anything. The only local facts on the page are the studio's own
// address and the fact that a meeting is possible.
//
// The address is read from getBusinessInfo, the same source the legal pages
// and the sitewide structured data use, so the three can never disagree.
// NAP consistency is most of what local search is actually measuring, and
// this repo has already had one drift (a fallback postcode of 33000 against
// the 33200 the legal pages publish).

export const metadata: Metadata = {
  title: "Agence web à Bordeaux : création de site internet | KOV",
  description:
    "Création de sites internet à Bordeaux : ce que la proximité change, ce qu'elle ne change pas, et comment nous rencontrer.",
  alternates: { canonical: `${SITE_URL}/agence-web-bordeaux` },
};

const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "Studio ou agence : le mot importe peu, la façon de travailler si",
    paragraphs: [
      "Nous disons studio, vous cherchez probablement une agence web. C'est la même chose, et l'insistance sur le vocabulaire est rarement le signe d'un bon prestataire.",
      "Ce qui change réellement d'une structure à l'autre n'est pas son nom, c'est le nombre de personnes entre vous et celle qui fait le travail. Chez nous il n'y en a aucune, et c'est le seul argument de taille que nous avancerons : vous parlez à qui conçoit et à qui construit, pas à un intermédiaire qui transmet.",
      "Cela a une contrepartie honnête : une petite structure ne peut pas tout mener de front. Si votre besoin dépasse ce que nous pouvons tenir correctement, nous le disons au cadrage plutôt qu'au milieu du projet.",
    ],
  },
  {
    heading: "Ce que la proximité change, et ce qu'elle ne change pas",
    paragraphs: [
      "Elle change le début. Un premier rendez-vous en face à face fait gagner des semaines à un cadrage, parce qu'on voit les lieux, les produits, les gens, et surtout parce qu'on entend ce qui se dit entre deux phrases. Beaucoup de projets se jouent là.",
      "Elle change aussi la photographie et la captation, quand elles font partie du projet. Se déplacer une journée à Bordeaux ou en Gironde ne se compare pas à organiser la même chose à distance.",
      "Elle ne change en revanche presque rien au reste. Le design, le développement, les allers-retours de recette et la mise en ligne se font aussi bien à distance, et un prestataire qui prétend le contraire vous vend de la présence plutôt que du travail. Nous travaillons avec des clients que nous n'avons jamais rencontrés physiquement, et ça se passe bien.",
    ],
  },
  {
    heading: "Ce que nous faisons",
    paragraphs: [
      "La création et la refonte de sites internet sur mesure, du cadrage à la mise en ligne, avec le design, le développement et le motion tenus par la même personne plutôt que sous-traités en morceaux.",
      "Nous construisons aussi ce qui vient autour d'un site quand c'est utile : un espace client où vos clients retrouvent leurs devis, leurs factures et l'avancement de leur projet, et les connexions aux outils que vous utilisez déjà.",
      "Ce que nous ne faisons pas, pour que ce soit clair dès la première lecture : pas de site sur gabarit repeint, pas de campagnes publicitaires, pas de gestion de réseaux sociaux.",
    ],
  },
  {
    heading: "Le référencement local, concrètement",
    paragraphs: [
      "Une recherche qui contient un nom de ville est une recherche à très forte intention : la personne veut rencontrer quelqu'un, pas se documenter. C'est aussi la plus atteignable, parce qu'elle se dispute à l'échelle d'une agglomération et non d'un pays.",
      "Elle se gagne d'abord en dehors du site, sur la fiche d'établissement : une adresse réelle, une catégorie juste, et une cohérence stricte entre ce qui est écrit là et ce qui est écrit ici. Cette cohérence est la moitié du travail, et c'est celle que presque personne ne tient dans la durée.",
      "Elle se gagne ensuite avec des pages qui parlent vraiment de ce que vous faites, plutôt qu'avec une liste de villes en bas de page. Nous n'en avons pas mis ici, et vous ne devriez pas en accepter sur votre propre site.",
    ],
  },
];

export default async function AgenceWebBordeauxPage() {
  const business = await getBusinessInfo();

  const questions = FAQ.filter(
    (item) => item.category === "Le studio" || item.category === "Le projet"
  ).slice(0, FAQ_COUNT);

  // Points at the sitewide organization node by @id rather than describing a
  // second business: one entity, mentioned twice, not two entities that a
  // parser has to guess are the same.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: `${SITE_URL}/agence-web-bordeaux`,
    about: { "@id": `${SITE_URL}/#organization` },
  };

  return (
    <main id="kov-main" tabIndex={-1} className="min-h-screen px-6 pt-28 md:pt-40 pb-20 md:pb-32 max-w-[1100px] mx-auto">
      {/* Static, hardcoded JSON, no user input — dangerouslySetInnerHTML is
          the only way to emit raw JSON-LD. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Reveal>
        <p className="flex items-center gap-3 text-xs uppercase tracking-widest text-kov-steel">
          <span aria-hidden="true" className="h-px w-7 bg-kov-red" />
          Bordeaux
        </p>

        <h1
          className="mt-7 font-display text-kov-bone max-w-3xl"
          style={{ fontSize: "clamp(32px, 4.4vw, 60px)", lineHeight: 1.08, letterSpacing: "-0.022em" }}
        >
          Agence web à Bordeaux
          <span className="text-kov-red">.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-kov-concrete text-lg leading-relaxed">
          Création et refonte de sites internet sur mesure, depuis Bordeaux. Stratégie, design, développement et motion
          tenus par un seul studio, pour des clients ici et ailleurs.
        </p>
      </Reveal>

      {SECTIONS.map((section) => (
        <Reveal key={section.heading} variant="fade">
          <section className="mt-16 border-t pt-12" style={{ borderColor: "var(--kov-border)" }}>
            <h2 className="font-display text-kov-bone uppercase text-xl max-w-2xl">{section.heading}</h2>
            <div className="mt-6 max-w-2xl space-y-5">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-kov-steel text-[15px] leading-[1.8]">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        </Reveal>
      ))}

      <Reveal variant="fade">
        <section className="mt-20 border-t pt-14" style={{ borderColor: "var(--kov-border)" }}>
          <h2 className="font-display text-kov-bone uppercase text-xl">Nous rencontrer</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
            <div>
              <h3 className="text-kov-bone text-sm font-medium">L&apos;adresse</h3>
              {/* The same string the legal pages and the structured data use,
                  from the same source. A local page whose address disagrees
                  with the business's own listing is worse than no page. */}
              <address className="mt-2 text-kov-steel text-sm leading-relaxed not-italic">
                KOV
                <br />
                {business.address.street}
                <br />
                {business.address.postalCode} {business.address.city}
              </address>
            </div>
            <div>
              <h3 className="text-kov-bone text-sm font-medium">Prendre rendez-vous</h3>
              <p className="mt-2 text-kov-steel text-sm leading-relaxed">
                Par le formulaire de contact. Dites-nous où vous en êtes et ce que vous cherchez à obtenir, et nous
                proposons un créneau, sur place ou en visio selon ce qui vous arrange.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block text-xs uppercase tracking-widest text-kov-steel hover:text-kov-red transition-colors"
              >
                Nous écrire →
              </Link>
            </div>
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

      <Reveal variant="blur">
        <section className="mt-24 text-center">
          <h2
            className="font-display text-kov-bone uppercase mx-auto max-w-[16ch]"
            style={{ fontSize: "clamp(26px, 3.4vw, 44px)", lineHeight: 1.1 }}
          >
            Parlons de votre projet<span className="text-kov-red">.</span>
          </h2>
          <p className="mt-6 mx-auto max-w-lg text-kov-steel text-sm leading-relaxed">
            À Bordeaux ou à distance, la première étape est la même : comprendre le problème avant de parler design.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-center gap-3 sm:gap-4">
            <KovCTA href="/contact" flat emphasis blockOnMobile>
              Démarrer mon projet
            </KovCTA>
            <Button href="/creation-site-internet" variant="ghost" className="w-full justify-center sm:w-auto">
              Comment se passe une création
            </Button>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
