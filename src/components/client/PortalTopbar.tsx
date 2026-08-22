"use client";

import Link from "next/link";
import { NotificationBell, type ClientNotificationItem } from "./NotificationBell";
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
}: {
  fullName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
  notifications: ClientNotificationItem[];
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

      <Link
        href="/client"
        aria-label="Rechercher dans votre espace"
        className="w-10 h-10 flex items-center justify-center text-kov-bone hover:text-kov-red transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </Link>

      <div className="flex items-center gap-2 ml-auto">
        <NotificationBell unreadCount={unreadCount} items={notifications} />
        <UserMenu fullName={fullName} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
