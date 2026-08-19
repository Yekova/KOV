"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
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
  {
    href: "/client/invoices",
    label: "Facturation",
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
  {
    href: "/client/support",
    label: "Support",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.2 9.2a2.8 2.8 0 1 1 3.9 3c-.9.6-1.1 1-1.1 2" />
        <circle cx="12" cy="16.6" r="0.3" fill="currentColor" />
      </>
    ),
  },
];

export function PortalSidebar({ openRequestsCount }: { openRequestsCount: number }) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex w-64 shrink-0 flex-col justify-between p-6 border-r"
      style={{ borderColor: "var(--kov-border)" }}
    >
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/client" ? pathname === "/client" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-widest transition-colors"
              style={{
                borderRadius: "var(--radius-sm)",
                color: isActive ? "var(--kov-bone)" : "var(--kov-steel)",
                background: isActive ? "var(--glass-bg)" : "transparent",
                border: isActive ? "1px solid var(--glass-border)" : "1px solid transparent",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                {item.icon}
              </svg>
              <span className="flex-1">{item.label}</span>
              {item.badge === "requests" && openRequestsCount > 0 && (
                <span
                  className="w-5 h-5 flex items-center justify-center text-[10px] text-kov-white"
                  style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
                >
                  {openRequestsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border p-4" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}>
        <p className="text-kov-bone text-xs uppercase tracking-widest mb-2">Besoin d&apos;aide ?</p>
        <p className="text-kov-steel text-xs leading-relaxed mb-4">Notre équipe est là pour vous.</p>
        <Link href="/client/support" className="text-kov-red text-xs uppercase tracking-widest hover:underline">
          Contacter KOV →
        </Link>
      </div>
    </aside>
  );
}
