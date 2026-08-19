import Link from "next/link";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/admin/leads"
      aria-label={unreadCount > 0 ? `${unreadCount} nouveaux leads` : "Notifications"}
      className="relative w-10 h-10 flex items-center justify-center text-kov-bone hover:text-kov-red transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] text-kov-white"
          style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
        >
          {unreadCount}
        </span>
      )}
    </Link>
  );
}
