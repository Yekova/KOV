// Pure resolution logic, no "server-only"/supabaseAdmin here on purpose —
// the composer and preview (client components) both need to run this on
// every keystroke. The actual lead → values lookup lives in
// leadVariables.ts (server-only), this file only knows how to substitute
// an already-resolved values map into a string.

export interface VariableDef {
  key: string;
  label: string;
  description: string;
}

export interface VariableCategory {
  key: string;
  label: string;
  variables: VariableDef[];
}

// Mirrors the email module spec's own documentation grouping (section 30).
// `company_name`/`website` are treated as aliases of the lead's own
// company/website — the spec lists them without a clear second meaning,
// and a website naturally belongs to the company that owns it, not to KOV.
export const VARIABLE_CATALOG: VariableCategory[] = [
  {
    key: "contact",
    label: "Contact",
    variables: [
      { key: "first_name", label: "Prénom", description: "Prénom du lead." },
      { key: "last_name", label: "Nom", description: "Nom du lead." },
      { key: "full_name", label: "Nom complet", description: "Prénom + nom, ou le nom brut si non scindé." },
      { key: "title", label: "Civilité", description: "M. / Mme / Dr / Autre — jamais déduite, vide si non renseignée." },
      {
        key: "greeting_name",
        label: "Formule d'appel",
        description: "« M. Dupont » si la civilité est connue, sinon « Jean » — pour ouvrir un email sans jamais afficher un champ vide.",
      },
      { key: "company", label: "Entreprise", description: "Entreprise du lead." },
      { key: "email", label: "Email", description: "Adresse email du lead." },
      { key: "phone", label: "Téléphone", description: "Téléphone du lead." },
      { key: "website", label: "Site web", description: "Site web du lead." },
    ],
  },
  {
    key: "project",
    label: "Projet",
    variables: [
      { key: "project_name", label: "Projet", description: "Type de projet renseigné sur le lead (ex. « Refonte de site »)." },
      { key: "project_type", label: "Type de projet", description: "Identique à {{project_name}}." },
      { key: "project_description", label: "Description du projet", description: "Message initial laissé par le lead." },
    ],
  },
  {
    key: "commercial",
    label: "Commercial",
    variables: [
      { key: "lead_status", label: "Statut", description: "Statut actuel du pipeline (ex. « Qualifié »)." },
      { key: "lead_score", label: "Score", description: "Score du lead sur 100." },
      { key: "estimated_value", label: "Valeur potentielle", description: "Budget estimé, formaté en euros." },
    ],
  },
  {
    key: "owner",
    label: "Responsable",
    variables: [
      { key: "owner_name", label: "Responsable", description: "Nom de l'admin assigné au lead." },
      { key: "owner_email", label: "Email du responsable", description: "Email de l'admin assigné." },
      { key: "owner_phone", label: "Téléphone du responsable", description: "Non disponible pour l'instant — aucun numéro n'est encore enregistré pour les comptes admin." },
    ],
  },
  {
    key: "meeting",
    label: "Rendez-vous",
    variables: [
      { key: "meeting_date", label: "Date du rendez-vous", description: "À écrire manuellement — aucune fonctionnalité de calendrier n'existe encore." },
      { key: "meeting_time", label: "Heure du rendez-vous", description: "Idem." },
    ],
  },
  {
    key: "quote",
    label: "Devis",
    variables: [
      { key: "quote_number", label: "Numéro de devis", description: "Référence du dernier devis lié à ce lead." },
      { key: "quote_amount", label: "Montant du devis", description: "Montant du dernier devis, formaté en euros." },
    ],
  },
];

export const ALL_VARIABLE_KEYS: string[] = VARIABLE_CATALOG.flatMap((c) => c.variables.map((v) => v.key));

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

// Never leaves "undefined", "null", or a raw "{{variable}}" in the output —
// an unresolved or unrecognized token always collapses to an empty string.
export function resolveVariables(text: string, values: Record<string, string>): string {
  return text.replace(VARIABLE_PATTERN, (_match, key: string) => values[key] ?? "");
}

// Which known variables a given text actually references — used to fill
// email_templates.variables (informational) without the author having to
// list them by hand.
export function extractVariableKeys(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) found.add(match[1]);
  return Array.from(found);
}
