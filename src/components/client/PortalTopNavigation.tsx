"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { portalNavigation } from "@/lib/portal/navigation";

// La navigation de l'espace client, à l'horizontale.
//
// Elle remplace la barre latérale, comme côté studio et pour la même
// raison : 240 pixels sur toute la hauteur, sur des écrans où la
// messagerie et les tables de factures manquent de largeur.
//
// Six entrées tiennent dans la barre — pas de menu « Plus » ici,
// contrairement à l'admin et ses dix-sept.
//
// ── « AIDE » EST UN LIEN, PLUS UN PERSONNAGE ─────────────────────────
//
// Le geste d'aide était un portrait illustré posé en bas de la barre
// latérale, avec une bulle « Besoin d'aide ? » qui apparaissait toute
// seule au bout de quatre secondes. Dans une interface claire et sobre,
// un personnage qui surgit est du bruit — et il n'a jamais rien fait de
// plus que ce lien : ouvrir les demandes.

export function PortalTopNavigation({
  openRequestsCount,
  children,
}: {
  openRequestsCount: number;
  /** La zone de droite : recherche, notifications, compte. */
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string): boolean {
    return href === "/client" ? pathname === "/client" : Boolean(pathname?.startsWith(href));
  }

  return (
    <header className="kov-topnav">
      <div className="mx-auto flex h-[68px] w-full max-w-[1700px] items-center gap-3 px-4 md:px-8">
        <Link href="/client" className="flex shrink-0 items-center gap-2" aria-label="KOV Studio — tableau de bord">
          <Image src="/kov/brand/kov-wordmark-black.png" alt="KOV" width={68} height={20} priority className="h-5 w-auto" />
          <span className="text-kov-steel hidden text-[10px] tracking-[0.2em] uppercase sm:inline">Studio</span>
        </Link>

        <nav className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Sections">
          {portalNavigation.map((item) => {
            const badge = item.badge === "requests" ? openRequestsCount : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="kov-topnav__link"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                  {item.icon}
                </svg>
                {item.label}
                {badge > 0 && (
                  <span
                    className="text-kov-white flex h-4 min-w-4 items-center justify-center px-1 text-[10px] tabular-nums"
                    style={{ background: "var(--kov-red)", borderRadius: "999px" }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Sobre et à sa place : le lien mène là où le portrait menait. */}
          <Link href="/client/requests" className="kov-topnav__link hidden sm:inline-flex">
            Aide
          </Link>
          {children}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="text-kov-concrete hover:text-kov-bone flex h-10 w-10 items-center justify-center transition-colors lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <MobileDrawer onClose={() => setMobileOpen(false)} isActive={isActive} openRequestsCount={openRequestsCount} />
      )}
    </header>
  );
}

function MobileDrawer({
  onClose,
  isActive,
  openRequestsCount,
}: {
  onClose: () => void;
  isActive: (href: string) => boolean;
  openRequestsCount: number;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    // Ré-enveloppé dans .kov-portal : porté sur <body>, il sort de la
    // portée du thème et se rendrait en palette sombre.
    <div className="kov-portal">
      <div className="fixed inset-0 bg-black/30" style={{ zIndex: "var(--z-modal)" }} onClick={onClose} />
      <div
        className="fixed top-0 right-0 bottom-0 w-[82vw] max-w-[320px] overflow-y-auto p-5"
        style={{ zIndex: "var(--z-modal)", background: "var(--kov-carbon)", boxShadow: "-18px 0 48px rgba(16,18,24,0.16)" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <span className="text-kov-steel text-[10px] tracking-widest uppercase">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="text-kov-concrete hover:text-kov-red flex h-9 w-9 items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {portalNavigation.map((item) => {
          const badge = item.badge === "requests" ? openRequestsCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="text-kov-concrete hover:text-kov-bone flex items-center gap-3 rounded-[10px] px-2 py-2.5 text-sm transition-colors aria-[current=page]:bg-black/[0.04] aria-[current=page]:text-kov-red"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                {item.icon}
              </svg>
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span
                  className="text-kov-white flex h-5 min-w-5 items-center justify-center px-1 text-[10px] tabular-nums"
                  style={{ background: "var(--kov-red)", borderRadius: "999px" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        <Link
          href="/client/requests"
          onClick={onClose}
          className="text-kov-concrete hover:text-kov-bone mt-2 flex items-center gap-3 rounded-[10px] px-2 py-2.5 text-sm transition-colors"
        >
          Aide
        </Link>
      </div>
    </div>,
    document.body
  );
}
