import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { Todo } from "@/components/legal/Todo";

export const metadata: Metadata = {
  title: "Confidentialité — KOV",
  description: "Comment KOV collecte et traite les données personnelles.",
  alternates: { canonical: "https://kov-agency.site/privacy" },
};

const SECTIONS = [
  {
    id: "collecte",
    title: "Ce qu'on collecte",
    body: (
      <p>
        Les seules données personnelles que KOV collecte sont celles que vous soumettez via le formulaire de
        contact : nom, adresse email, numéro de téléphone (facultatif) et votre message. On utilise également des
        cookies de mesure d&apos;audience (Vercel Analytics), mais uniquement avec votre consentement — vous pouvez
        l&apos;accorder ou le refuser via le bandeau affiché à votre première visite, et revenir sur ce choix à tout
        moment en effaçant les données de ce site dans votre navigateur. En dehors de ça, on n&apos;utilise aucun
        autre traceur.
      </p>
    ),
  },
  {
    id: "pourquoi",
    title: "Pourquoi on les collecte",
    body: (
      <p>
        Uniquement pour répondre à la demande de projet que vous avez initiée. On ne vend ni ne partage ces données
        avec des tiers à des fins commerciales.
      </p>
    ),
  },
  {
    id: "base-legale",
    title: "Base légale",
    body: <p>Le traitement repose sur votre consentement, donné en soumettant volontairement le formulaire.</p>,
  },
  {
    id: "stockage",
    title: "Où c'est stocké",
    body: (
      <p>
        Les soumissions sont stockées dans une base de données Supabase hébergée dans l&apos;UE (Irlande). Le site
        lui-même est hébergé par Vercel Inc. (États-Unis). Aucune donnée n&apos;est utilisée pour entraîner un
        modèle d&apos;IA.
      </p>
    ),
  },
  {
    id: "conservation",
    title: "Conservation",
    body: (
      <p>
        On conserve les soumissions du formulaire de contact pendant{" "}
        <Todo>durée de conservation — ex. 3 ans à compter du dernier contact</Todo>, après quoi elles sont
        supprimées.
      </p>
    ),
  },
  {
    id: "droits",
    title: "Vos droits",
    body: (
      <p>
        En vertu du RGPD, vous avez le droit d&apos;accéder à vos données, de les rectifier, de les supprimer ou de
        les exporter, et de retirer votre consentement à tout moment. Pour exercer ces droits, contactez-nous à{" "}
        <Todo>adresse email de contact</Todo> ou via le formulaire de contact.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc
      title="Politique de confidentialité"
      updated="Août 2026"
      intro="Ce qu'on collecte, pourquoi, et comment reprendre la main — en clair, pas en clauses illisibles."
      sections={SECTIONS}
    />
  );
}
