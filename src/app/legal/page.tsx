import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { Todo } from "@/components/legal/Todo";

export const metadata: Metadata = {
  title: "Mentions légales — KOV",
  description: "Mentions légales du site KOV.",
  alternates: { canonical: "https://kov-agency.site/legal" },
};

const SECTIONS = [
  {
    id: "editeur",
    title: "Éditeur du site",
    body: (
      <>
        <p>
          Ce site (kov-agency.site) est édité par KOV, <Todo>forme juridique — ex. auto-entrepreneur, SASU, EI</Todo>,
          immatriculée sous le SIRET <Todo>numéro de SIRET</Todo>, dont le siège social est situé{" "}
          <Todo>adresse du siège social</Todo>, Bordeaux, France.
        </p>
        <p>
          Directeur de la publication : <Todo>nom complet de la personne légalement responsable du site</Todo>.
        </p>
        <p>Contact : via le formulaire à l&apos;adresse kov-agency.site/contact.</p>
      </>
    ),
  },
  {
    id: "hebergement",
    title: "Hébergement",
    body: <p>Ce site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.</p>,
  },
  {
    id: "propriete-intellectuelle",
    title: "Propriété intellectuelle",
    body: (
      <p>
        Le nom KOV, son logo et l&apos;ensemble du contenu de ce site (textes, visuels, code) sont la propriété de
        KOV sauf mention contraire. Toute reproduction sans autorisation écrite préalable est interdite.
      </p>
    ),
  },
  {
    id: "responsabilite",
    title: "Responsabilité",
    body: (
      <p>
        KOV s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées sur ce site mais ne peut
        garantir qu&apos;elles soient complètes ou à jour en permanence.
      </p>
    ),
  },
];

export default function LegalNoticePage() {
  return (
    <LegalDoc
      title="Mentions légales"
      updated="Août 2026"
      intro="Les informations qu'un site est tenu d'afficher légalement — sans le jargon qui va généralement avec."
      sections={SECTIONS}
    />
  );
}
