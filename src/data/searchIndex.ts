// Static search index — a hand-written map of real site content, not a real
// full-text/backend search. Good enough as a first version; if content grows
// enough that this goes stale, generate it from the actual page content
// instead of hand-maintaining it further.

export interface SearchItem {
  title: string;
  category: "Expertise" | "Studio" | "Work" | "Contact";
  href: string;
  description: string;
  keywords?: string[];
}

export const searchIndex: SearchItem[] = [
  {
    title: "Strategy",
    category: "Expertise",
    href: "/expertise",
    description: "Positioning, structure, and user journeys — decided before anything gets designed.",
  },
  {
    title: "Design",
    category: "Expertise",
    href: "/expertise",
    description: "Interfaces engineered like architecture. Structure first, style earned.",
  },
  {
    title: "Development",
    category: "Expertise",
    href: "/expertise",
    description: "Production-grade code from day one, built to survive real traffic.",
  },
  {
    title: "Motion",
    category: "Expertise",
    href: "/expertise",
    description: "Movement that explains, never performs.",
  },
  {
    title: "Systems",
    category: "Expertise",
    href: "/expertise",
    description: "Digital architecture built to scale.",
  },
  {
    title: "Integration",
    category: "Expertise",
    href: "/expertise",
    description: "Tools, data, and automations, connected.",
    keywords: ["crm", "automation", "api"],
  },
  {
    title: "Our process",
    category: "Expertise",
    href: "/expertise",
    description: "Seven steps: Discover, Structure, Design, Develop, Motion, Launch, Evolve.",
    keywords: ["how do you work", "process", "methodology"],
  },
  {
    title: "What we build",
    category: "Expertise",
    href: "/expertise",
    description: "Corporate websites, immersive websites, web applications, dashboards, client portals, digital systems.",
    keywords: ["services", "what services do you offer", "crm", "web app"],
  },
  {
    title: "Kanti — Wealth Management",
    category: "Work",
    href: "/#work",
    description: "Strategy, design, and development for a wealth management digital experience.",
    keywords: ["case study", "project", "portfolio", "show me your work"],
  },
  {
    title: "Philosophy",
    category: "Studio",
    href: "/studio",
    description: "Good design doesn't need to shout. Clarté, intention, impact.",
  },
  {
    title: "Small by design",
    category: "Studio",
    href: "/studio",
    description: "Less layers, more involvement, better work — who KOV is.",
    keywords: ["about", "team", "who we are"],
  },
  {
    title: "Start a project",
    category: "Contact",
    href: "/contact",
    description: "Tell us what you're building.",
    keywords: ["get in touch", "hire", "quote", "contact"],
  },
];
