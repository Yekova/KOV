import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — KOV",
  description: "Conditions d'utilisation du site KOV.",
};

export default function TermsPage() {
  return (
    <LegalDoc title="Conditions d'utilisation" updated="Août 2026">
      <section>
        <h2>Champ d&apos;application</h2>
        <p>
          Ces conditions régissent uniquement l&apos;utilisation du site kov-agency.site. Elles ne constituent pas un
          contrat de prestation — les engagements de projet avec KOV sont régis par un accord écrit distinct.
        </p>
      </section>

      <section>
        <h2>Utilisation autorisée</h2>
        <p>
          Vous vous engagez à ne pas utiliser ce site d&apos;une manière qui l&apos;endommage, le désactive ou le
          perturbe, ni qui nuise à son utilisation par d&apos;autres personnes.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>Le contenu de ce site est protégé par le droit d&apos;auteur. Voir les mentions légales pour plus de détails.</p>
      </section>

      <section>
        <h2>Droit applicable</h2>
        <p>Ces conditions sont régies par le droit français. Les litiges relèvent de la compétence des tribunaux de Bordeaux, France.</p>
      </section>
    </LegalDoc>
  );
}
