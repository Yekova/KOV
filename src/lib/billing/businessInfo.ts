// Informations légales réelles de l'émetteur — vérifiées via le registre
// public des entreprises françaises (recherche-entreprises.api.gouv.fr),
// confirmées par la correspondance exacte du SIRET et de l'adresse.
// Ne jamais remplacer par des valeurs inventées.
export const BUSINESS_INFO = {
  legalName: "Mattéo Delorme",
  commercialName: "KOV",
  legalForm: "Entreprise individuelle",
  address: {
    street: "49 rue André Maginot",
    postalCode: "33000",
    city: "Bordeaux",
    country: "France",
  },
  siret: "941 801 391 00017",
  siren: "941 801 391",
  apeCode: "62.01Z",
  // Entreprise individuelle créée le 15/02/2025, aucun numéro de TVA au
  // registre — présumé sous le régime de la franchise en base. À confirmer/
  // corriger si ce n'est pas le cas.
  vatMention: "TVA non applicable, art. 293 B du CGI",
  iban: "FR76 2823 3000 0175 2849 2704 095",
  bic: "",
  // Délai de paiement légal par défaut (Code de commerce, art. L441-10) en
  // l'absence d'accord contraire — pas une préférence métier arbitraire.
  paymentTermsDays: 30,
  latePaymentMention:
    "En cas de retard de paiement, une pénalité égale à 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 €.",
} as const;
