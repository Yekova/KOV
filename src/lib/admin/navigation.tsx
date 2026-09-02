import type { ReactNode } from "react";

export type AdminBadgeSource = "leads" | "tasks";

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  badgeSource?: AdminBadgeSource;
};

export type AdminNavSection = {
  id: string;
  label: string | null;
  items: AdminNavItem[];
};

// Grouped by function rather than one flat 13-item list — Commercial (the
// lead → email → devis pipeline) is what an admin actually works through
// day to day, Projets is delivery once a client is won, Entreprise is the
// back-office view across all clients, Système is configuration. Dashboard
// stays ungrouped at the top since it isn't "part of" any one section.
export const adminNavigation: AdminNavSection[] = [
  {
    id: "overview",
    label: null,
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/admin",
        icon: (
          <>
            <rect x="4" y="4" width="7" height="7" rx="1" />
            <rect x="13" y="4" width="7" height="7" rx="1" />
            <rect x="4" y="13" width="7" height="7" rx="1" />
            <rect x="13" y="13" width="7" height="7" rx="1" />
          </>
        ),
      },
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    items: [
      {
        id: "leads",
        label: "Leads",
        href: "/admin/leads",
        icon: <path d="M4 5h16v11H8l-4 4V5z" />,
        badgeSource: "leads",
      },
      {
        id: "emails",
        label: "Emails",
        href: "/admin/emails",
        icon: (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </>
        ),
      },
      {
        id: "quotes",
        label: "Devis",
        href: "/admin/quotes",
        icon: (
          <>
            <path d="M7 3h7l5 5v13H7z" />
            <path d="M14 3v5h5" />
            <path d="M9.5 13.5l2 2 4-4.5" />
          </>
        ),
      },
    ],
  },
  {
    id: "delivery",
    label: "Projets",
    items: [
      {
        id: "clients",
        label: "Clients",
        href: "/admin/clients",
        icon: (
          <>
            <circle cx="9" cy="8" r="3" />
            <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
            <circle cx="17" cy="9" r="2.4" />
            <path d="M15.5 20c.3-2.7 1.9-4.6 4-5" />
          </>
        ),
      },
      {
        id: "projects",
        label: "Projets",
        href: "/admin/projects",
        icon: <path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />,
      },
      {
        id: "tasks",
        label: "Tâches",
        href: "/admin/tasks",
        icon: (
          <>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8.5 12.5l2.2 2.2 4.8-4.8" />
          </>
        ),
        badgeSource: "tasks",
      },
      {
        id: "content",
        label: "Contenu",
        href: "/admin/content",
        icon: (
          <>
            <path d="M7 3h7l5 5v13H7z" />
            <path d="M14 3v5h5" />
          </>
        ),
      },
    ],
  },
  {
    id: "business",
    label: "Entreprise",
    items: [
      {
        id: "billing",
        label: "Facturation",
        href: "/admin/billing",
        icon: (
          <>
            <rect x="3" y="6" width="18" height="13" rx="1.5" />
            <path d="M3 10h18" />
          </>
        ),
      },
      {
        id: "team",
        label: "Équipe",
        href: "/admin/team",
        icon: (
          <>
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5" />
          </>
        ),
      },
      {
        id: "analytics",
        label: "Analytics",
        href: "/admin/analytics",
        icon: (
          <>
            <path d="M4 20V10" />
            <path d="M11 20V4" />
            <path d="M18 20v-7" />
          </>
        ),
      },
    ],
  },
  {
    id: "system",
    label: "Système",
    items: [
      {
        id: "automations",
        label: "Automatisations",
        href: "/admin/automations",
        icon: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
      },
      {
        id: "settings",
        label: "Paramètres",
        href: "/admin/settings",
        icon: (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        ),
      },
    ],
  },
];

// Sections without a real Phase-1 build yet — the nav item still appears
// (full target IA is shown per the approved plan), but routes to an honest
// "Bientôt disponible" stub rather than hiding the link or faking content.
// Currently empty — kept around as a place to register the next
// genuinely-unbuilt section rather than deleted outright.
export const UNBUILT_ADMIN_SECTIONS = new Set<string>([]);
