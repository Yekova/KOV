import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — KOV",
  description: "Conditions d'utilisation du site KOV.",
  alternates: { canonical: "https://kov-agency.site/terms" },
};

const SECTIONS = [
  {
    id: "champ-application",
    title: "Champ d'application",
    body: (
      <p>
        Ces conditions régissent uniquement l&apos;utilisation du site kov-agency.site. Elles ne constituent pas un
        contrat de prestation — les engagements de projet avec KOV sont régis par un accord écrit distinct.
      </p>
    ),
  },
  {
    id: "utilisation-autorisee",
    title: "Utilisation autorisée",
    body: (
      <p>
        Vous vous engagez à ne pas utiliser ce site d&apos;une manière qui l&apos;endommage, le désactive ou le
        perturbe, ni qui nuise à son utilisation par d&apos;autres personnes.
      </p>
    ),
  },
  {
    id: "propriete-intellectuelle",
    title: "Propriété intellectuelle",
    body: <p>Le contenu de ce site est protégé par le droit d&apos;auteur. Voir les mentions légales pour plus de détails.</p>,
  },
  {
    id: "droit-applicable",
    title: "Droit applicable",
    body: <p>Ces conditions sont régies par le droit français. Les litiges relèvent de la compétence des tribunaux de Bordeaux, France.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Conditions d'utilisation"
      updated="Août 2026"
      intro="Ce qui régit l'utilisation de ce site. Pas votre projet avec KOV — ça, c'est un accord écrit à part."
      sections={SECTIONS}
    />
  );
}
