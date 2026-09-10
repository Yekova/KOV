// Single source of truth for the /legal hub's sidebar order/labels —
// shared between the layout (renders the list) and each page (needs its
// own number/href to stay in sync without hardcoding it twice).
export interface LegalDocMeta {
  number: string;
  slug: string;
  href: string;
  label: string;
}

export const LEGAL_DOCS: LegalDocMeta[] = [
  { number: "01", slug: "cgv", href: "/legal/cgv", label: "Conditions générales de vente" },
  { number: "02", slug: "mentions", href: "/legal", label: "Mentions légales" },
  { number: "03", slug: "confidentialite", href: "/legal/confidentialite", label: "Politique de confidentialité" },
  { number: "04", slug: "cookies", href: "/legal/cookies", label: "Politique de cookies" },
  { number: "05", slug: "conditions-utilisation", href: "/legal/conditions-utilisation", label: "Conditions d'utilisation" },
  { number: "06", slug: "gestion-cookies", href: "/legal/gestion-cookies", label: "Gestion des cookies" },
];
