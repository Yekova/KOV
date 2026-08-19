import Link from "next/link";
import Image from "next/image";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

const MARKETING_LINKS = [
  { href: "/#work", label: "Projets" },
  { href: "/expertise", label: "Expertise" },
  { href: "/studio", label: "Studio" },
];

export function PortalTopbar({
  fullName,
  avatarUrl,
  unreadCount,
}: {
  fullName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
}) {
  return (
    <header
      className="flex items-center justify-between gap-6 px-6 py-4 border-b"
      style={{ borderColor: "var(--kov-border)" }}
    >
      <Link href="/" className="flex items-center">
        <span className="relative w-16 h-4 overflow-hidden block">
          <Image
            src="/kov/brand/kov-wordmark-bone-on-black.png"
            alt="KOV"
            fill
            sizes="64px"
            className="object-cover"
            style={{ objectPosition: "50% 48%", transform: "scale(1.65)", mixBlendMode: "screen" }}
            priority
          />
        </span>
      </Link>

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
        <NotificationBell unreadCount={unreadCount} />
        <UserMenu fullName={fullName} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
