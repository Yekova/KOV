// La classe d'un champ, écrite une fois.
//
// Cette chaîne exacte était recopiée dans une douzaine de fichiers — les
// formulaires de lead, de devis, de facture, de projet, de tâche, le menu
// d'action rapide, la fiche client. Changer le style d'un champ demandait
// donc douze modifications, et il suffisait d'en oublier une pour que deux
// formulaires voisins cessent de se ressembler.
//
// Exporté depuis components/ui et non components/admin : le portail client
// a exactement les mêmes champs, et les ranger côté admin garantirait une
// seconde copie plus tard.

export const FIELD_CLASS =
  "w-full bg-transparent border px-3 py-2 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors";

export const FIELD_STYLE = {
  borderColor: "var(--kov-border)",
  borderRadius: "var(--radius-sm)",
} as const;

/** Le libellé au-dessus d'un champ, dans la casse de l'admin. */
export const FIELD_LABEL = "text-xs uppercase tracking-widest text-kov-steel";
