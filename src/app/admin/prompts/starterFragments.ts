// Les fragments partagés par les prompts de pipeline.
//
// Écrits une fois et importés, plutôt que recopiés dans vingt gabarits :
// une règle qu'on corrige à un seul endroit reste une règle, une règle
// recopiée vingt fois devient vingt règles qui divergent.

/** La règle permanente du studio, en dernière section de chaque étape.
 *
 *  Un prompt qui ne la porte pas produit tôt ou tard un chiffre que
 *  personne ne peut sourcer, et c'est le genre d'erreur qu'on ne voit
 *  qu'une fois en ligne. */
export const INTERDITS = `# INTERDITS
- Ne rien inventer : chiffre, note, avis, témoignage, prix, délai, référence
  client, qualification, adresse, ni donnée structurée.
- Ce qui manque est listé comme « à fournir », jamais comblé par une
  vraisemblance.
- Aucune promesse que le studio n'a pas confirmée.`;

/** Le questionnement avant production.
 *
 *  Sa valeur tient entièrement à ses garde-fous. Un simple « pose-moi des
 *  questions » produit un interrogatoire de douze points auquel on cesse de
 *  répondre dès la troisième fois, et le prompt finit ignoré. Les quatre
 *  limites qui le rendent supportable :
 *
 *  - une question à la fois, sinon c'est un formulaire déguisé ;
 *  - trois au maximum, sinon le coût dépasse le gain ;
 *  - une valeur par défaut proposée, pour que « comme tu veux » reste une
 *    réponse utilisable et non un blocage ;
 *  - une sortie immédiate, « vas-y », qui produit sous hypothèses écrites.
 *
 *  Et l'interdiction de demander ce que les entrées donnent déjà, qui est
 *  ce qui distingue un entretien d'un questionnaire. */
export const CLARIFIER = `# AVANT DE PRODUIRE
Pose-moi les questions dont la réponse changerait ce que tu vas produire.
Une seule à la fois, la plus déterminante d'abord, et attends ma réponse.

- Ne demande jamais ce que les entrées ci-dessus donnent déjà.
- Question fermée quand deux options suffisent, ouverte sinon.
- Propose une réponse par défaut quand tu en as une raisonnable, pour que
  « comme tu veux » soit une réponse utilisable.
- Trois questions au maximum, et arrête-toi dès que tu peux produire sans
  supposer, même après une seule.
- Si je réponds « vas-y », produis immédiatement et liste tes hypothèses en
  tête de réponse.`;
