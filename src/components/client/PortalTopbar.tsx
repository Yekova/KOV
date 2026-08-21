"use client";

import Link from "next/link";
import Image from "next/image";
import { NotificationBell, type ClientNotificationItem } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

const MARKETING_LINKS = [
  { href: "/#work", label: "Projets" },
  { href: "/expertise", label: "Expertise" },
  { href: "/journal", label: "Journal" },
  { href: "/studio", label: "Studio" },
];

export function PortalTopbar({
  fullName,
  avatarUrl,
  unreadCount,
  notifications,
  onMenuClick,
}: {
  fullName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
  notifications: ClientNotificationItem[];
  onMenuClick: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-4" style={{ background: "var(--kov-carbon)" }}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
          className="md:hidden text-kov-bone hover:text-kov-red transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Link href="/" className="flex items-center">
          <Image
            src="/kov/brand/kov-wordmark-bone.png"
            alt="KOV"
            width={1116}
            height={209}
            className="h-5 w-auto"
            priority
          />
        </Link>
      </div>

      <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-widest text-kov-steel">
        {MARKETING_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-kov-bone transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
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
        <NotificationBell unreadCount={unreadCount} items={notifications} />
        <UserMenu fullName={fullName} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
