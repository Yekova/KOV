import { redirect } from "next/navigation";

// Cette page disait « Cette page arrive bientôt » et proposait un bouton
// vers Demandes — c'est-à-dire vers une autre entrée du même menu. C'était
// une impasse sur huit entrées de navigation, et l'assistant de la barre
// latérale y menait aussi.
//
// L'entrée a été retirée du menu. La route reste et redirige, parce qu'un
// signet ou un vieux lien ne doit pas tomber sur un 404 : il tombe sur
// l'écran qui répond réellement à « j'ai besoin d'aide ».
export default function ClientSupportPage() {
  redirect("/client/requests");
}
