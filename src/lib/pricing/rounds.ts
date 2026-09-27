import type { RoundCode } from "./types.ts";

// Les huit rounds de production, et leur correspondance avec les sept
// phases KOV.
//
// Les rounds servent à CHIFFRER, les phases à MONTRER au client. Ce sont
// deux granularités volontairement distinctes : R2 (direction créative) et
// R3 (design) se vendent séparément parce qu'ils n'occupent pas les mêmes
// jours, mais le client lit « Designer », un seul mot, sur la frise de son
// espace.
//
// La correspondance est écrite ici plutôt que déduite ailleurs, pour qu'un
// devis signé puisse pré-remplir project_phases avec les bonnes dates. Les
// noms de phase doivent rester identiques à src/data/processSteps.ts, qui
// est la source unique côté site et côté portail.

export interface RoundDefinition {
  code: RoundCode;
  label: string;
  /** Le nom exact de la phase KOV correspondante, tel que le client le lit. */
  phaseName: string;
  summary: string;
}

export const ROUNDS: RoundDefinition[] = [
  { code: "R0", label: "R0 Cadrage",            phaseName: "Découvrir",  summary: "Brief, objectifs, périmètre, contraintes, budget." },
  { code: "R1", label: "R1 Architecture",       phaseName: "Structurer", summary: "Arborescence, parcours, fonctionnalités, modèle de données." },
  { code: "R2", label: "R2 Direction créative", phaseName: "Designer",   summary: "Moodboard, principes graphiques, typographie." },
  { code: "R3", label: "R3 Design",             phaseName: "Designer",   summary: "Interfaces, responsive, design system." },
  { code: "R4", label: "R4 Build",              phaseName: "Développer", summary: "Développement, intégrations, CMS." },
  { code: "R5", label: "R5 Motion et polish",   phaseName: "Animer",     summary: "Animations, micro-interactions." },
  { code: "R6", label: "R6 QA et lancement",    phaseName: "Lancer",     summary: "Recette, SEO technique, performance, analytics, mise en production." },
  { code: "R7", label: "R7 Evolve",             phaseName: "Évoluer",    summary: "Abonnements, évolutions." },
];

const BY_CODE = new Map(ROUNDS.map((round) => [round.code, round]));

export function getRound(code: RoundCode): RoundDefinition {
  const round = BY_CODE.get(code);
  if (!round) throw new Error(`Round inconnu : ${code}`);
  return round;
}

export function compareRounds(a: RoundCode, b: RoundCode): number {
  return ROUNDS.findIndex((r) => r.code === a) - ROUNDS.findIndex((r) => r.code === b);
}
