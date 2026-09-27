import type { RoundCode, ScheduleTemplateEntry } from "./types.ts";

// L'échéancier.
//
// Une seule règle compte, et la spec la pose explicitement : la somme des
// échéances doit valoir EXACTEMENT le total TTC. Un échéancier dont les
// lignes somment à un centime près du total est un échéancier faux, et
// c'est le genre de faute qu'un client remarque, parce qu'il additionne.
//
// Le résidu d'arrondi va sur la DERNIÈRE échéance, jamais sur la première :
// l'acompte est le nombre que le client lit et compare le jour de la
// signature, le solde est celui qu'il découvre à la fin.

export interface ScheduleEntry {
  label: string;
  percentBp: number;
  roundCode: RoundCode | null;
  amountCents: number;
}

export function buildSchedule(totalInclVatCents: number, template: ScheduleTemplateEntry[]): ScheduleEntry[] {
  if (template.length === 0) {
    return [{ label: "À la commande", percentBp: 10_000, roundCode: null, amountCents: totalInclVatCents }];
  }

  const entries = template.map((entry) => ({
    ...entry,
    amountCents: Math.floor((totalInclVatCents * entry.percentBp) / 10_000),
  }));

  const allocated = entries.reduce((sum, entry) => sum + entry.amountCents, 0);
  entries[entries.length - 1].amountCents += totalInclVatCents - allocated;

  return entries;
}

/** La somme des pourcentages, en points de base. Doit valoir 10 000. */
export function scheduleTotalBp(template: ScheduleTemplateEntry[]): number {
  return template.reduce((sum, entry) => sum + entry.percentBp, 0);
}

export function isScheduleComplete(template: ScheduleTemplateEntry[]): boolean {
  return scheduleTotalBp(template) === 10_000;
}
