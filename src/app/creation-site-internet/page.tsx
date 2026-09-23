import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/data/faq";
import { PILLARS } from "@/data/expertisePillars";
import { Reveal } from "@/components/ui/Reveal";
import { KovCTA } from "@/components/ui/KovCTA";
import { Button } from "@/components/ui/Button";

const SITE_URL = "https://kov-agency.site";
const FAQ_COUNT = 4;

// The page that exists because the phrase did not.
//
// Measured before writing it: the homepage says "création de site" zero
// times in 2446 words, and /expertise/developpement says it zero times in
// 1626 (it says "site" 55 times, but always inside the studio's own
// vocabulary: "développement web sur mesure"). Nothing on the site was
// about buying a website, so nothing could rank for the phrase people type
// when they want to buy one.
//
// Deliberately not a seventh /expertise page. Those six are about the
// crafts KOV works in; this one is about the transaction a visitor is
// considering, which is a different question and needs its own URL, its
// own title and its own answer.
//
// What it does not do: quote a price, promise a ranking, give a timeline,
// or claim a result. Those are the four things this kind of page usually
// invents, and every one of them would be a number nobody measured.

export const metadata: Metadata = {
  title: "Création de site internet sur mesure | KOV Bordeaux",
  description:
    "Création et refonte de sites internet sur mesure : ce que le sur-mesure change, ce qui fait varier un projet, comment ça se déroule et ce que vous recevez.",
  alternates: { canonical: `${SITE_URL}/creation-site-internet` },
};

// Prose lives in data rather than inline JSX for the same reason the
// expertise pages do it: 1400 words of French in JSX is 1400 chances to
// forget an &apos;.
const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "Sur mesure, et ce que ça exclut",
    paragraphs: [
      "Un site sur mesure n'est pas un site plus joli qu'un autre. C'est un site dont la structure a été décidée à partir de votre activité, plutôt que reprise d'un gabarit conçu pour tout le monde et repeint à vos couleurs.",
      "La différence ne se voit pas le jour de la mise en ligne. Elle se voit six mois plus tard, quand il faut ajouter une offre, déplacer une étape du parcours ou brancher un outil que vous utilisez déjà. Un gabarit résiste à tout ça, parce qu'il a été pensé pour un cas général qui n'est pas le vôtre.",
      "Ce que le sur-mesure exclut, concrètement : les thèmes achetés et redécorés, les pages construites en empilant des blocs jusqu'à ce que ça tienne debout, et les banques d'images qui font que trois sites du même secteur finissent par se ressembler.",
    ],
  },
  {
    heading: "Création ou refonte : ce ne sont pas les mêmes projets",
    paragraphs: [
      "Une création part d'une page blanche. L'essentiel du travail n'est pas technique, il est décisionnel : quoi dire, dans quel ordre, à qui, et ce qu'on choisit de ne pas dire.",
      "Une refonte part d'un existant qui a de la valeur, même quand il déplaît : des adresses déjà connues des moteurs, des contenus qui fonctionnent sans que personne ne sache lesquels, des habitudes prises par vos clients. Le travail principal devient donc de trier, et surtout de ne pas casser ce qui marchait.",
      "C'est le risque propre à toute refonte : perdre en visibilité ce qu'on gagne en esthétique. Un site refait sans inventaire de l'existant ni plan de redirection peut repartir de zéro aux yeux des moteurs, et personne ne s'en aperçoit avant plusieurs semaines. Une refonte comporte donc une étape qu'une création n'a pas, et cette étape n'est pas négociable.",
    ],
  },
  {
    heading: "Ce qui fait vraiment varier un projet",
    paragraphs: [
      "La question du budget arrive presque toujours avant la description du besoin. C'est normal, et c'est précisément la question à laquelle personne d'honnête ne peut répondre par un chiffre en l'air.",
      "Ce qui fait varier un projet, dans l'ordre : le nombre de parcours différents à traiter, la quantité de contenu à produire ou à reprendre, les connexions à des outils que vous utilisez déjà, l'existence ou non d'un espace accessible après connexion, la part de sur-mesure dans le design, et le niveau d'animation.",
      "Ce qui fait moins varier qu'on ne le croit : le nombre de pages. Vingt pages qui suivent trois modèles coûtent moins qu'une seule page dont la mise en page n'existe nulle part ailleurs.",
      "C'est pour ça qu'un devis chiffré arrive après un cadrage, jamais avant. Un chiffre donné avant d'avoir compris le problème n'engage personne, et il se révise toujours dans le même sens.",
    ],
  },
  {
    heading: "Comment se déroule une création",
    paragraphs: [
      "Le cadrage d'abord : votre activité, vos objectifs, ce que vos visiteurs viennent chercher et ce qu'ils doivent pouvoir faire. C'est là que se prennent les décisions qui coûtent cher à changer plus tard.",
      "Puis l'architecture, qui décide de ce qui est une page et de ce qui n'en est pas une. Puis le design, sur les vrais contenus plutôt que sur du faux texte, parce qu'une mise en page qui ne tient qu'avec des phrases inventées ne tiendra pas non plus le jour de la mise en ligne.",
      "Ensuite le développement, la recette avec vous, la mise en ligne, et la suite. Cette dernière étape compte autant que les autres : un site est un objet vivant, et celui qui le construit devrait encore être joignable une fois qu'il tourne.",
    ],
  },
  {
    heading: "Ce que vous recevez à la fin",
    paragraphs: [
      "Un site dont vous êtes propriétaire. Le code, le nom de domaine, les accès à l'hébergement et aux services : tout est à votre nom, et vous partez avec si vous partez.",
      "Une interface pour modifier vos contenus sans nous solliciter, parce qu'un site qu'on ne peut pas mettre à jour soi-même cesse d'être mis à jour.",
      "Et une base technique documentée, lisible par quelqu'un d'autre que nous. Un prestataire qui garde les clés n'est pas un prestataire, c'est une location.",
    ],
  },
  {
    heading: "Vitrine, boutique, application : trois métiers, un seul mot",
    paragraphs: [
      "On dit création de site internet ou création de site web, c'est la même chose. Mais l'expression, quelle que soit sa forme, recouvre au moins trois projets différents, et les confondre au moment du devis est la première cause de malentendu.",
      "Un site vitrine a un travail de conviction : faire comprendre ce que vous faites et donner envie d'en parler avec vous. Une boutique a un travail de vente, avec tout ce qui vient derrière : catalogue, stock, paiement, livraison, retours. Une application est un outil, avec des comptes, des droits et des données qui appartiennent à chacun de vos utilisateurs.",
      "Les trois peuvent se ressembler en façade. Ils n'ont ni la même complexité, ni le même budget, ni la même durée de vie. Savoir lequel des trois vous voulez est la première chose à trancher, avant même de parler de design.",
    ],
  },
  {
    heading: "Le référencement ne s'ajoute pas après",
    paragraphs: [
      "Une partie de ce qui décide de votre visibilité se joue pendant la construction, pas après : la structure des adresses, la façon dont les pages se lient entre elles, la vitesse, et le fait que votre contenu existe dans le HTML renvoyé par le serveur plutôt que dessiné ensuite par le navigateur.",
      "Un site construit sans y penser peut demander autant de travail à rattraper qu'il en aurait demandé à faire correctement. Ce n'est pas une prestation supplémentaire, c'est une contrainte de conception.",
      "Ce que personne ne peut vous promettre, en revanche, c'est une position. Les moteurs ne vendent pas de garanties et n'en délivrent à personne. Ce qui se promet, c'est un site qu'ils peuvent lire, comprendre et citer.",
    ],
  },
];

const DELIVERABLES: { title: string; body: string }[] = [
  { title: "Cadrage", body: "Le problème posé avant la solution, et les arbitrages écrits plutôt que supposés." },
  { title: "Architecture", body: "Ce qui est une page, ce qui n'en est pas une, et comment on circule entre les deux." },
  { title: "Design sur mesure", body: "Une direction pensée pour votre marque, appliquée à vos vrais contenus." },
  { title: "Développement", body: "Un site rapide, accessible et lisible par les moteurs, propriété pleine et entière." },
  { title: "Contenus", body: "Reprise ou production, avec la structure qui rend chaque page trouvable." },
  { title: "Suite", body: "Mise en ligne, prise en main de l'interface d'édition, et quelqu'un de joignable après." },
];

export default function CreationSiteInternetPage() {
  // Same four categories a buyer actually asks about, drawn from the same
  // fifty answers /faq renders. Shown but not marked up as a FAQPage: /faq
  // carries that for all fifty, and the same question marked up twice is a
  // duplicate Google has no reason to reward.
  const questions = FAQ.filter(
    (item) => item.category === "Le projet" || item.category === "Budget & contrat"
  ).slice(0, FAQ_COUNT);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Création de site internet",
    name: "Création de site internet sur mesure",
    description: metadata.description,
    url: `${SITE_URL}/creation-site-internet`,
    provider: { "@type": "Organization", name: "KOV", url: SITE_URL },
    // France rather than Bordeaux: the studio is in Bordeaux and the work is
    // not limited to it. Claiming a service area narrower than the truth is
    // as wrong as claiming one wider.
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
          Création de site internet
        </p>

        <h1
          className="mt-7 font-display text-kov-bone max-w-3xl"
          style={{ fontSize: "clamp(32px, 4.4vw, 60px)", lineHeight: 1.08, letterSpacing: "-0.022em" }}
        >
          Création de site internet sur mesure
          <span className="text-kov-red">.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-kov-concrete text-lg leading-relaxed">
          Un site construit pour votre activité, pas adapté depuis un gabarit. Voici ce que ça change, ce qui fait
          varier un projet, et ce que vous avez entre les mains à la fin.
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
          <h2 className="font-display text-kov-bone uppercase text-xl">Ce que comprend un projet</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-9">
            {DELIVERABLES.map((item) => (
              <div key={item.title}>
                <h3 className="text-kov-bone text-sm font-medium">{item.title}</h3>
                <p className="mt-2 text-kov-steel text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <Link
            href="/#process"
            className="mt-8 inline-block text-xs uppercase tracking-widest text-kov-steel hover:text-kov-red transition-colors"
          >
            Le processus en détail →
          </Link>
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
          <h2 className="font-display text-kov-bone uppercase text-xl">Les six métiers mobilisés</h2>
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 list-none">
            {PILLARS.map((pillar) => (
              <li key={pillar.slug}>
                <Link href={`/expertise/${pillar.slug}`} className="group block">
                  <span className="font-mono text-[10px] text-kov-red">{pillar.number}</span>
                  <span className="mt-1 block text-kov-bone text-sm group-hover:text-kov-red transition-colors">
                    {pillar.title}
                  </span>
                  <span className="mt-1 block text-kov-steel text-xs leading-relaxed">{pillar.tagline}</span>
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
            Parlons de votre site<span className="text-kov-red">.</span>
          </h2>
          <p className="mt-6 mx-auto max-w-lg text-kov-steel text-sm leading-relaxed">
            Dites-nous ce que vous avez aujourd&apos;hui et ce qui vous manque. On revient avec une lecture du problème
            avant de parler design ou budget.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-center gap-3 sm:gap-4">
            <KovCTA href="/contact" flat emphasis blockOnMobile>
              Démarrer mon projet
            </KovCTA>
            <Button href="/projets" variant="ghost" className="w-full justify-center sm:w-auto">
              Voir nos réalisations
            </Button>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
