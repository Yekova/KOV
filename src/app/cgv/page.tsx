import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal/LegalDoc";
import { getBusinessInfo } from "@/lib/billing/businessInfo";

export const metadata: Metadata = {
  title: "Conditions générales de vente — KOV",
  description: "Conditions générales de vente applicables aux prestations KOV : création de sites, applications et systèmes numériques.",
  alternates: { canonical: "https://kov-agency.site/cgv" },
};

export default async function CgvPage() {
  const business = await getBusinessInfo();
  const address = `${business.address.street}, ${business.address.postalCode} ${business.address.city}, ${business.address.country}`;

  const SECTIONS = [
    {
      id: "champ-application",
      title: "1. Champ d'application",
      body: (
        <>
          <p>
            Les présentes conditions générales de vente régissent l&apos;ensemble des prestations réalisées par KOV :
            création de sites web, d&apos;applications et de systèmes numériques, ainsi que les prestations associées
            (maintenance, hébergement, évolutions).
          </p>
          <p>
            Les conditions particulières figurant sur un devis prévalent sur les présentes CGV en cas de contradiction.
            La signature d&apos;un devis avec la mention « bon pour accord » implique l&apos;acceptation sans réserve
            des présentes CGV.
          </p>
        </>
      ),
    },
    {
      id: "definitions",
      title: "2. Définitions",
      body: (
        <ul>
          <li>
            <strong>KOV</strong> : nom commercial de {business.legalName}, {business.legalForm.toLowerCase()}, SIRET{" "}
            {business.siret}, dont le siège est situé {address}.
          </li>
          <li>
            <strong>Client</strong> : personne physique ou morale signataire d&apos;un devis avec KOV.
          </li>
          <li>
            <strong>Services</strong> : ensemble des prestations effectuées par KOV, telles que décrites à
            l&apos;article 3.
          </li>
          <li>
            <strong>Site web</strong> : ensemble structuré de pages comprenant des éléments textuels, graphiques et
            multimédias, accessible via un nom de domaine.
          </li>
          <li>
            <strong>Projets conséquents</strong> : création de sites, d&apos;applications web ou de systèmes
            numériques sur mesure.
          </li>
          <li>
            <strong>Autres projets</strong> : maintenance, évolutions, contenus, hébergement et prestations connexes.
          </li>
        </ul>
      ),
    },
    {
      id: "services",
      title: "3. Services proposés",
      body: (
        <ul>
          <li>Création de sites corporate, sites immersifs et applications web</li>
          <li>Création de dashboards et d&apos;espaces clients sur mesure</li>
          <li>Conception de systèmes numériques (CRM, facturation, automatisations)</li>
          <li>Création d&apos;identités numériques</li>
          <li>Achat et gestion de noms de domaine</li>
          <li>Hébergement et prestations système</li>
          <li>Maintenance, évolutions et mises à jour de sites et applications existants</li>
        </ul>
      ),
    },
    {
      id: "conditions-creation",
      title: "4. Conditions de réalisation",
      body: (
        <>
          <p>Pour les projets conséquents :</p>
          <ul>
            <li>Devis gratuit établi sur demande, valable un mois à compter de son émission</li>
            <li>Signature du devis avec la mention « bon pour accord »</li>
            <li>Rédaction d&apos;une description fonctionnelle ou d&apos;une maquette à valider par le client</li>
            <li>Phase de développement</li>
            <li>Validation finale du client avant mise en ligne</li>
            <li>Publication et facturation</li>
          </ul>
          <p>
            Les études, maquettes et documents préparatoires demeurent la propriété de KOV tant qu&apos;ils
            n&apos;ont pas fait l&apos;objet d&apos;une cession explicite (voir article 8). KOV peut refuser toute
            demande non conforme pour des raisons techniques justifiées. Le client s&apos;engage à fournir des
            textes et visuels relus et exempts de fautes ; la saisie ou la correction de contenu n&apos;est pas
            incluse par défaut et peut faire l&apos;objet d&apos;une prestation complémentaire.
          </p>
        </>
      ),
    },
    {
      id: "promotion-creations",
      title: "5. Présentation des réalisations",
      body: (
        <p>
          Sauf opposition écrite du client, KOV peut présenter les créations réalisées pour le client à titre de
          référence commerciale (portfolio, journal, réseaux professionnels), sans limitation de durée. La mention «
          Conception : KOV » peut figurer sur les créations diffusées à cet effet.
        </p>
      ),
    },
    {
      id: "reference-clients",
      title: "6. Référence au client",
      body: (
        <p>
          Le client autorise KOV à mentionner son nom ou sa dénomination sociale à titre de référence commerciale.
          Sauf accord contraire, la mention « Réalisation : KOV » peut figurer en pied de page du site livré.
        </p>
      ),
    },
    {
      id: "modification-demande",
      title: "7. Modification de la demande initiale",
      body: (
        <p>
          Toute demande de création ou de modification non prévue au devis initial fait l&apos;objet d&apos;un
          nouveau devis dès lors qu&apos;elle entraîne un dépassement significatif du temps estimé, une modification
          substantielle du périmètre du projet, ou un traitement de fichiers non prévu initialement.
        </p>
      ),
    },
    {
      id: "propriete-intellectuelle",
      title: "8. Propriété intellectuelle",
      body: (
        <ul>
          <li>Les éléments fournis par le client (textes, images, marques) restent sa propriété.</li>
          <li>
            Les éléments modifiés par KOV restent la propriété du client pour leur version originale ; les
            modifications apportées (programmation, intégration) sont la propriété de KOV jusqu&apos;à cession.
          </li>
          <li>La cession des droits au client intervient à réception du complet encaissement des sommes dues.</li>
          <li>
            Sauf mention contraire au devis, le code source développé sur mesure est cédé au client pour une durée
            de 99 ans, sans réserve d&apos;espace ni de destination.
          </li>
          <li>
            Les droits d&apos;utilisation des éléments non réalisés par KOV (polices, banques d&apos;images,
            bibliothèques tierces) ne sont pas cessibles et restent soumis à leurs licences d&apos;origine.
          </li>
        </ul>
      ),
    },
    {
      id: "responsabilite-client",
      title: "9. Responsabilité du client",
      body: (
        <>
          <p>
            Le client s&apos;engage à fournir des informations exactes et à jour, et à maintenir des coordonnées de
            contact valides. En cas de collecte de données personnelles sur le site livré, il lui appartient de se
            conformer au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés
            du 6 janvier 1978 modifiée.
          </p>
          <p>
            Le contenu fourni par le client doit respecter la législation en vigueur ainsi que les droits d&apos;auteur
            et de propriété intellectuelle des tiers. Sont strictement exclus tout contenu pornographique, tout
            programme piraté, tout contenu raciste, diffamatoire, discriminatoire ou portant atteinte aux droits
            humains, tout contenu relatif aux jeux d&apos;argent en ligne, ainsi que tout contenu violent ou portant
            atteinte à des droits de propriété intellectuelle.
          </p>
        </>
      ),
    },
    {
      id: "responsabilite-kov",
      title: "10. Responsabilité de KOV",
      body: (
        <p>
          KOV s&apos;engage à livrer les prestations dans les délais convenus, mais décline toute responsabilité en
          cas d&apos;incident technique majeur indépendant de sa volonté (cas de force majeure, rupture d&apos;un
          service tiers, interruption réseau). KOV livre un produit conforme aux spécifications validées avec le
          client. KOV ne garantit ni augmentation du chiffre d&apos;affaires, ni volume de trafic, ni résultat de
          référencement : ces prestations relèvent d&apos;une obligation de moyens, non de résultat.
        </p>
      ),
    },
    {
      id: "garanties",
      title: "11. Garanties",
      body: (
        <p>
          KOV corrige gratuitement tout dysfonctionnement avéré, imputable à son développement, signalé dans le mois
          suivant la livraison. Cette garantie ne couvre pas les anomalies résultant d&apos;un défaut de maintenance,
          d&apos;une utilisation non conforme, ou d&apos;une modification du site ou de l&apos;application par le
          client ou un tiers non mandaté par KOV.
        </p>
      ),
    },
    {
      id: "rupture-contrat",
      title: "12. Rupture du contrat",
      body: (
        <p>
          En cas de non-paiement à l&apos;échéance ou de manquement du client à ses obligations, KOV peut résilier le
          contrat après mise en demeure restée sans effet pendant 8 jours. Les acomptes déjà versés restent acquis à
          KOV à titre d&apos;indemnité forfaitaire. En cas de rupture à l&apos;initiative du client avant
          l&apos;achèvement du projet, les sommes dues au titre de l&apos;échéancier en cours restent exigibles.
        </p>
      ),
    },
    {
      id: "tarifs",
      title: "13. Offres et tarifs",
      body: (
        <p>
          Les tarifs sont établis au cas par cas selon la nature et l&apos;ampleur du projet et communiqués par
          devis. Un devis estimatif peut être ajusté au montant final en fonction du temps réellement passé, dans les
          conditions prévues à l&apos;article 7. KOV se réserve le droit de modifier ses CGV et ses tarifs sans
          préavis, sans que cela n&apos;affecte les devis déjà signés.
        </p>
      ),
    },
    {
      id: "etudes-prealables",
      title: "14. Études préalables et chiffrages",
      body: (
        <p>
          Les études, analyses fonctionnelles ou techniques et prestations de conseil réalisées en amont d&apos;un
          projet peuvent être facturées indépendamment de la validation du devis final. En l&apos;absence de
          signature du devis, ces prestations sont facturées au temps réellement passé, selon le taux horaire
          communiqué au client.
        </p>
      ),
    },
    {
      id: "paiement",
      title: "15. Modalités de paiement",
      body: (
        <>
          <p>
            Le montant et l&apos;échéancier de l&apos;acompte demandé (à la signature du devis, à la validation
            d&apos;une étape intermédiaire, à la livraison) sont précisés sur chaque devis. Sauf mention contraire,
            les factures sont payables sous {business.paymentTermsDays} jours, exclusivement par virement bancaire.
          </p>
          <p>{business.latePaymentMention}</p>
        </>
      ),
    },
    {
      id: "reclamations",
      title: "16. Réclamations",
      body: (
        <p>
          Toute réclamation relative à une facture doit être adressée par lettre recommandée avec accusé de
          réception, dans les 7 jours suivant sa réception, au siège de KOV : {address}. Passé ce délai, les travaux
          facturés sont considérés comme définitivement acceptés.
        </p>
      ),
    },
    {
      id: "droit-applicable",
      title: "17. Loi applicable et juridiction",
      body: (
        <p>
          Les présentes CGV sont régies par le droit français. Tout litige relève de la compétence des tribunaux de
          Bordeaux. KOV élit domicile à l&apos;adresse de son siège : {address}.
        </p>
      ),
    },
  ];

  return (
    <LegalDoc
      title="Conditions générales de vente"
      updated="Septembre 2026"
      intro="Ce qui encadre chaque prestation KOV, du devis à la livraison — le fameux « accord écrit à part » évoqué dans nos conditions d'utilisation."
      sections={SECTIONS}
    />
  );
}
