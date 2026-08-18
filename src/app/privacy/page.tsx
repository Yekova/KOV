import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { Todo } from "@/components/legal/Todo";

export const metadata: Metadata = {
  title: "Confidentialité — KOV",
  description: "Comment KOV collecte et traite les données personnelles.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc title="Politique de confidentialité" updated="Août 2026">
      <section>
        <h2>Ce qu&apos;on collecte</h2>
        <p>
          Les seules données personnelles que KOV collecte sont celles que vous soumettez via le formulaire de
          contact : nom, adresse email, numéro de téléphone (facultatif) et votre message. On n&apos;utilise ni
          cookies ni traceurs analytiques sur ce site, au-delà de ce qui est strictement nécessaire à son
          fonctionnement.
        </p>
      </section>

      <section>
        <h2>Pourquoi on les collecte</h2>
        <p>Uniquement pour répondre à la demande de projet que vous avez initiée. On ne vend ni ne partage ces données avec des tiers à des fins commerciales.</p>
      </section>

      <section>
        <h2>Base légale</h2>
        <p>Le traitement repose sur votre consentement, donné en soumettant volontairement le formulaire.</p>
      </section>

      <section>
        <h2>Où c&apos;est stocké</h2>
        <p>
          Les soumissions sont stockées dans une base de données Supabase hébergée dans l&apos;UE (Irlande). Le site
          lui-même est hébergé par Vercel Inc. (États-Unis). Aucune donnée n&apos;est utilisée pour entraîner un
          modèle d&apos;IA.
        </p>
      </section>

      <section>
        <h2>Conservation</h2>
        <p>
          On conserve les soumissions du formulaire de contact pendant{" "}
          <Todo>durée de conservation — ex. 3 ans à compter du dernier contact</Todo>, après quoi elles sont
          supprimées.
        </p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>
          En vertu du RGPD, vous avez le droit d&apos;accéder à vos données, de les rectifier, de les supprimer ou de
          les exporter, et de retirer votre consentement à tout moment. Pour exercer ces droits, contactez-nous à{" "}
          <Todo>adresse email de contact</Todo> ou via le formulaire de contact.
        </p>
      </section>
    </LegalDoc>
  );
}
