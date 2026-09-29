"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { markMyNotificationsRead } from "@/app/client/actions";
import { EnableBrowserAlerts } from "@/components/client/EnableBrowserAlerts";

export type ClientNotificationItem = {
  id: string;
  title: string;
  href: string;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationBell({ unreadCount, items }: { unreadCount: number; items: ClientNotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLButtonElement>(null);

  // `seen` tient le badge éteint tout de suite, sans attendre l'aller-retour
  // serveur ni un rafraîchissement de la route : le panneau est ouvert, les
  // notifications sont vues, la pastille n'a plus de raison d'être là.
  const [seen, setSeen] = useState(false);
  const showBadge = unreadCount > 0 && !seen;

  function toggle() {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      if (unreadCount > 0 && !seen) {
        setSeen(true);
        // Sans await ni transition : le marquage ne doit rien retarder à
        // l'écran, et s'il échoue le panneau s'est ouvert quand même — le
        // badge reviendra à la prochaine navigation, ce qui est le bon
        // échec pour une notification.
        void markMyNotificationsRead().catch(() => setSeen(false));
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative">
      <button
        ref={ref}
        type="button"
        onClick={toggle}
        aria-label={showBadge ? `${unreadCount} notifications non lues` : "Notifications"}
        className="relative w-10 h-10 flex items-center justify-center text-kov-bone hover:text-kov-red transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {showBadge && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2"
            style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
          />
        )}
      </button>

      {open &&
        createPortal(
          <div className="kov-portal">
            <div className="fixed inset-0" style={{ zIndex: "var(--z-modal)" }} onClick={() => setOpen(false)} />
            <div
              className="fixed w-80 max-h-[70vh] overflow-y-auto border py-2"
              style={{
                top: position.top,
                right: position.right,
                zIndex: "var(--z-modal)",
                background: "var(--glass-bg)",
                backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
                borderColor: "var(--glass-border)",
                borderRadius: "var(--radius-glass)",
                boxShadow: "var(--glass-shadow-full)",
              }}
            >
              <p className="px-4 py-2 text-kov-steel text-xs uppercase tracking-widest">Notifications récentes</p>
              {items.length === 0 ? (
                <p className="px-4 py-4 text-kov-steel text-sm">Rien de nouveau.</p>
              ) : (
                items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 kov-hover transition-colors"
                  >
                    <p className="text-kov-bone text-sm">{item.title}</p>
                    <p className="text-kov-steel text-xs mt-0.5">{timeAgo(item.createdAt)}</p>
                  </Link>
                ))
              )}

              {/* L'autorisation se demande ICI, depuis un clic. Une demande
                  faite au chargement est refusée par les navigateurs, et le
                  refus vaut ensuite pour tout le domaine. */}
              <EnableBrowserAlerts />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
