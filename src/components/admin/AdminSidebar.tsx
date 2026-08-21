"use client";

import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/lib/admin/navigation";
import { useMobileNav } from "./MobileNavContext";

function NavLinks({
  pathname,
  badgeCounts,
  onNavigate,
}: {
  pathname: string | null;
  badgeCounts: Record<string, number>;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1 flex-1">
      {adminNavigation.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        const badge = item.badgeSource ? badgeCounts[item.badgeSource] : undefined;

        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onNavigate}
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
            {!!badge && badge > 0 && (
              <span
                className="w-5 h-5 flex items-center justify-center text-[10px] text-kov-white"
                style={{ background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ badgeCounts }: { badgeCounts: Record<string, number> }) {
  const pathname = usePathname();
  const { open, setOpen } = useMobileNav();

  return (
    <>
      <aside className="hidden md:flex w-60 shrink-0 flex-col p-6" style={{ background: "var(--kov-carbon)" }}>
        <Link href="/admin" className="flex items-center gap-2.5 mb-10">
          <Image
            src="/kov/brand/kov-wordmark-bone.png"
            alt="KOV"
            width={1116}
            height={209}
            className="h-5 w-auto"
            priority
          />
          <span className="text-kov-steel text-[10px] uppercase tracking-widest border-l pl-2.5" style={{ borderColor: "var(--kov-border)" }}>
            Studio
          </span>
        </Link>

        <NavLinks pathname={pathname} badgeCounts={badgeCounts} />
      </aside>

      {open &&
        createPortal(
          <div className="md:hidden fixed inset-0" style={{ zIndex: "var(--z-modal)" }}>
            <div className="absolute inset-0" style={{ background: "rgba(10,10,10,0.7)" }} onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] p-6 flex flex-col" style={{ background: "var(--kov-carbon)" }}>
              <div className="flex items-center justify-between mb-8">
                <Image src="/kov/brand/kov-wordmark-bone.png" alt="KOV" width={1116} height={209} className="h-5 w-auto" />
                <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu" className="text-kov-steel hover:text-kov-red transition-colors">
                  ✕
                </button>
              </div>
              <NavLinks pathname={pathname} badgeCounts={badgeCounts} onNavigate={() => setOpen(false)} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
