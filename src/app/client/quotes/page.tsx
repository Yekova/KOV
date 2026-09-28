import { redirect } from "next/navigation";

// Les devis ont rejoint la facturation.
//
// Un devis devient une facture (quotes.invoice_id) : les séparer obligeait
// le client à suivre un même montant d'un onglet à l'autre. L'entrée
// « Devis » a quitté le menu ; la route reste et redirige, parce qu'un
// signet, un e-mail de relance ou une notification plus ancienne ne doit
// pas tomber sur un 404.
export default function ClientQuotesPage() {
  redirect("/client/invoices");
}
