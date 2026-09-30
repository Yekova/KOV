// Les règles du mot de passe, partagées entre le formulaire et l'action.
//
// Écrites une fois : si l'écran et le serveur ne disent pas la même chose,
// c'est l'écran qui ment, et l'utilisateur découvre la vraie règle en se
// faisant refuser.

export const PASSWORD_MIN = 12;

export interface PasswordRule {
  label: string;
  met: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: `${PASSWORD_MIN} caractères minimum`, met: (v) => v.length >= PASSWORD_MIN },
  // Les classes couvrent les lettres accentuées : refuser « É » comme
  // majuscule serait absurde sur un site francophone.
  { label: "Une majuscule", met: (v) => /[A-ZÀ-Þ]/.test(v) },
  { label: "Une minuscule", met: (v) => /[a-zß-ÿ]/.test(v) },
  { label: "Un chiffre", met: (v) => /[0-9]/.test(v) },
  { label: "Un caractère spécial", met: (v) => /[^A-Za-z0-9]/.test(v) },
];

/** Le premier manquement, formulé pour être lu. Null quand tout passe. */
export function passwordProblem(password: string): string | null {
  const failed = PASSWORD_RULES.find((rule) => !rule.met(password));
  return failed ? `Il manque : ${failed.label.toLowerCase()}.` : null;
}

/** Combien de règles sont satisfaites, sur le total. Sert la jauge de
 *  robustesse — qui compte des règles, et ne prétend pas mesurer une
 *  entropie qu'on ne calcule pas ici. */
export function passwordScore(password: string): { met: number; total: number } {
  return { met: PASSWORD_RULES.filter((rule) => rule.met(password)).length, total: PASSWORD_RULES.length };
}
