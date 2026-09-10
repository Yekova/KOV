import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Politique de cookies | KOV",
  description: "Quels cookies KOV utilise, pourquoi, et comment changer d'avis.",
  alternates: { canonical: "https://kov-agency.site/legal/cookies" },
};

const SECTIONS = [
  {
    id: "definition",
    title: "Qu'est-ce qu'un cookie ?",
    body: (
      <p>
        Un cookie est un petit fichier déposé par un site dans votre navigateur, qui lui permet de retenir une
        information d&apos;une visite à l&apos;autre (une préférence, une mesure d&apos;audience). Il n&apos;a pas
        accès au reste de votre appareil et ne peut, à lui seul, vous identifier nommément.
      </p>
    ),
  },
  {
    id: "cookies-utilises",
    title: "Les cookies utilisés sur ce site",
    body: (
      <p>
        KOV n&apos;utilise qu&apos;un seul type de cookie non essentiel : la mesure d&apos;audience (Vercel
        Analytics), qui permet de savoir combien de personnes visitent le site et quelles pages elles consultent,
        sans données individuellement identifiables. Il n&apos;est chargé qu&apos;avec votre consentement, jamais
        par défaut. En dehors de ça, le site n&apos;utilise aucun cookie publicitaire ni traceur tiers.
      </p>
    ),
  },
  {
    id: "memorisation",
    title: "Comment votre choix est mémorisé",
    body: (
      <p>
        Votre décision (accepté ou refusé) est enregistrée localement dans le stockage de votre navigateur, propre à
        cet appareil et ce navigateur — pas dans un cookie tiers, pas côté serveur. Elle reste valable tant que vous
        ne l&apos;effacez pas ou ne la modifiez pas vous-même, et ne nous est jamais transmise.
      </p>
    ),
  },
  {
    id: "modifier",
    title: "Modifier votre choix",
    body: (
      <p>
        Vous pouvez revenir sur votre choix à tout moment depuis la page{" "}
        <Link href="/legal/gestion-cookies" className="text-kov-red hover:underline">
          Gestion des cookies
        </Link>
        , qui rouvre le bandeau de consentement.
      </p>
    ),
  },
];

export default function CookiesPolicyPage() {
  return (
    <LegalDocument
      number="04"
      title="Politique de cookies"
      updated="Septembre 2026"
      intro="Un seul cookie non essentiel, jamais chargé sans votre accord : la mesure d'audience."
      sections={SECTIONS}
    />
  );
}
