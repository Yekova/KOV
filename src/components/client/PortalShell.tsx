"use client";

import { useState, type ReactNode } from "react";
import { PortalSidebar } from "./PortalSidebar";
import { PortalTopbar } from "./PortalTopbar";
import type { ClientNotificationItem } from "./NotificationBell";

export function PortalShell({
  fullName,
  avatarUrl,
  unreadCount,
  notifications,
  openRequestsCount,
  children,
}: {
  fullName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
  notifications: ClientNotificationItem[];
  openRequestsCount: number;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--kov-black)" }}>
      <PortalSidebar openRequestsCount={openRequestsCount} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalTopbar
          fullName={fullName}
          avatarUrl={avatarUrl}
          unreadCount={unreadCount}
          notifications={notifications}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
