import type { ReactNode } from "react";

// Les entrées de l'espace client.
//
// Sorties de PortalSidebar, qui n'existe plus : la navigation est passée à
// l'horizontale comme celle de l'admin. Les données de navigation n'ont
// jamais eu leur place dans un composant de mise en page — c'est ce qui
// obligeait à les recopier pour en faire une seconde vue.
//
// Six entrées : elles tiennent toutes dans la barre, donc pas de menu
// « Plus » ici, contrairement à l'admin et ses dix-sept.

export type PortalNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: "requests";
};

export const portalNavigation: PortalNavItem[] = [
  {
    href: "/client",
    label: "Tableau de bord",
    icon: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
      </>
    ),
  },
  {
    href: "/client/projects",
    label: "Mes projets",
    icon: <path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />,
  },
  {
    href: "/client/requests",
    label: "Demandes",
    icon: <path d="M4 5h16v11H8l-4 4V5z" />,
    badge: "requests" as const,
  },
  {
    href: "/client/documents",
    label: "Documents",
    icon: (
      <>
        <path d="M7 3h7l5 5v13H7z" />
        <path d="M14 3v5h5" />
      </>
    ),
  },
  // « Devis » a fusionné avec « Facturation » : un devis devient une
  // facture, les séparer obligeait à suivre un montant d'un onglet à
  // l'autre. /client/quotes redirige vers /client/invoices.
  {
    href: "/client/invoices",
    label: "Devis & factures",
    icon: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="1.5" />
        <path d="M3 10h18" />
      </>
    ),
  },
  {
    href: "/client/team",
    label: "Équipe KOV",
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M15.5 20c.3-2.7 1.9-4.6 4-5" />
      </>
    ),
  },
  // « Support » a été retiré : c’était une entrée sur huit qui menait à
  // « cette page arrive bientôt », avec un bouton vers Demandes — une autre
  // entrée du même menu. La route redirige maintenant vers Demandes.
];
