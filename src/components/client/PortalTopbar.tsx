"use client";

import { NotificationBell, type ClientNotificationItem } from "./NotificationBell";
import { PortalSearch, type PortalSearchItem } from "./PortalSearch";
import { UserMenu } from "./UserMenu";
import { useMobileNav } from "@/components/ui/MobileNavContext";

// No logo, no marketing nav here — matches the admin topbar's composition
// exactly. The logo lives at the top of the sidebar (PortalSidebar), and
// marketing links belong to the public site's own Nav, not the portal.
export function PortalTopbar({
  fullName,
  avatarUrl,
  unreadCount,
  notifications,
  searchIndex,
}: {
  fullName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
  notifications: ClientNotificationItem[];
  searchIndex: PortalSearchItem[];
}) {
  const { setOpen } = useMobileNav();
  return (
    <header className="flex items-center gap-4 px-6 py-4" style={{ background: "var(--kov-carbon)" }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="md:hidden text-kov-bone hover:text-kov-red transition-colors shrink-0"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* La recherche est ici et non plus au milieu du tableau de bord :
          chercher une facture depuis la page Documents obligeait à revenir
          en arrière. Elle est dans la coquille, donc sur chaque écran. */}
      <PortalSearch items={searchIndex} />

      <div className="flex items-center gap-2 ml-auto">
        <NotificationBell unreadCount={unreadCount} items={notifications} />
        <UserMenu fullName={fullName} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
