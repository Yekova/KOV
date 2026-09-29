"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adminPrimaryNav, adminSecondaryNav, type AdminBadgeSource } from "@/lib/admin/navigation";

// La navigation de l'admin, à l'horizontale.
//
// Elle remplace la barre latérale. Le gain n'est pas esthétique : la
// latérale mangeait 240 pixels sur toute la hauteur, sur des écrans où les
// tables de projets et le pipeline commercial manquent de largeur — c'est
// exactement là que la place servait.
//
// ── SEPT ENTRÉES, PAS DIX-SEPT ───────────────────────────────────────
//
// L'admin en compte dix-sept. Sept tiennent en largeur ; les autres sont
// dans « Plus », regroupées sous leur section d'origine pour qu'aucune ne
// perde son contexte en y descendant. Les deux listes sont dérivées de la
// même source (voir lib/admin/navigation), donc une entrée ajoutée demain
// ne peut pas disparaître.
//
// ── LES MENUS SORTENT DE L'ARBRE ─────────────────────────────────────
//
// createPortal rend hors de .kov-admin, où les variables de thème clair ne
// s'appliquent plus. Chaque contenu porté ré-enveloppe donc dans un div
// .kov-admin — sans quoi le menu se rendrait en palette sombre au milieu
// d'une page claire.

export function AdminTopNavigation({
  badgeCounts,
  logoHref = "/admin",
  children,
}: {
  badgeCounts: Record<string, number>;
  logoHref?: string;
  /** La zone de droite : recherche, action rapide, notifications, compte. */
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string): boolean {
    return href === "/admin" ? pathname === "/admin" : Boolean(pathname?.startsWith(href));
  }

  return (
    <header className="kov-topnav">
      <div className="mx-auto flex h-[68px] w-full max-w-[1600px] items-center gap-3 px-4 md:px-8">
        <Link href={logoHref} className="flex shrink-0 items-center gap-2" aria-label="KOV Studio — tableau de bord">
          <Image src="/kov/brand/kov-wordmark-black.png" alt="KOV" width={68} height={20} priority className="h-5 w-auto" />
          <span className="text-kov-steel hidden text-[10px] tracking-[0.2em] uppercase sm:inline">Studio</span>
        </Link>

        {/* La navigation disparaît sous lg : sept entrées ne tiennent pas
            sur une tablette, et les comprimer les rendrait illisibles. Le
            tiroir en bas de ce fichier les reprend toutes. */}
        <nav className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Sections">
          {adminPrimaryNav.map((item) => {
            const active = isActive(item.href);
            const badge = item.badgeSource ? badgeCounts[item.badgeSource as AdminBadgeSource] : undefined;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="kov-topnav__link"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                  {item.icon}
                </svg>
                {item.label}
                {!!badge && badge > 0 && (
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
          <MoreMenu isActive={isActive} badgeCounts={badgeCounts} />
        </nav>

        <div className="ml-auto flex items-center gap-2">{children}</div>

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

      {mobileOpen && <MobileDrawer onClose={() => setMobileOpen(false)} isActive={isActive} badgeCounts={badgeCounts} />}
    </header>
  );
}

// ── « Plus » ─────────────────────────────────────────────────────────

function MoreMenu({
  isActive,
  badgeCounts,
}: {
  isActive: (href: string) => boolean;
  badgeCounts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  // Une entrée du menu qui est la page courante doit se voir sur le bouton
  // « Plus » lui-même : sinon on ouvre le menu pour savoir où l'on est.
  const anyActive = adminSecondaryNav.some((section) => section.items.some((item) => isActive(item.href)));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-current={anyActive ? "page" : undefined}
        className="kov-topnav__link"
      >
        Plus
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="kov-enter absolute top-full left-0 mt-2 w-60 overflow-hidden py-1.5"
          style={{
            zIndex: "var(--z-modal)",
            background: "#fff",
            border: "1px solid rgba(0,0,0,0.07)",
            borderRadius: "14px",
            boxShadow: "0 18px 48px rgba(16,18,24,0.14)",
          }}
        >
          {adminSecondaryNav.map((section) => (
            <div key={section.id} className="py-1">
              {section.label && (
                <p className="text-kov-steel px-3 pb-1 text-[10px] tracking-widest uppercase">{section.label}</p>
              )}
              {section.items.map((item) => {
                const badge = item.badgeSource ? badgeCounts[item.badgeSource as AdminBadgeSource] : undefined;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="text-kov-concrete hover:text-kov-bone flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-black/[0.04] aria-[current=page]:text-kov-red"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                      {item.icon}
                    </svg>
                    <span className="flex-1">{item.label}</span>
                    {!!badge && badge > 0 && (
                      <span className="text-kov-steel text-[11px] tabular-nums">{badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Le tiroir mobile ─────────────────────────────────────────────────

function MobileDrawer({
  onClose,
  isActive,
  badgeCounts,
}: {
  onClose: () => void;
  isActive: (href: string) => boolean;
  badgeCounts: Record<string, number>;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Le tiroir montre les DIX-SEPT entrées : sur mobile il n'y a pas de
  // barre pour en porter sept, donc la distinction « principal / plus »
  // n'a plus d'objet et ne ferait qu'ajouter un niveau à traverser.
  const sections = [{ id: "primary", label: null, items: adminPrimaryNav }, ...adminSecondaryNav];

  return createPortal(
    // Ré-enveloppé dans .kov-admin : porté sur <body>, il sort de la portée
    // du thème clair et se rendrait en palette sombre sans cette ligne.
    <div className="kov-admin">
      <div className="fixed inset-0 bg-black/30" style={{ zIndex: "var(--z-modal)" }} onClick={onClose} />
      <div
        className="fixed top-0 right-0 bottom-0 w-[82vw] max-w-[320px] overflow-y-auto p-5"
        style={{ zIndex: "var(--z-modal)", background: "#fff", boxShadow: "-18px 0 48px rgba(16,18,24,0.16)" }}
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

        {sections.map((section) => (
          <div key={section.id} className="mb-4">
            {section.label && (
              <p className="text-kov-steel mb-1 px-2 text-[10px] tracking-widest uppercase">{section.label}</p>
            )}
            {section.items.map((item) => {
              const badge = item.badgeSource ? badgeCounts[item.badgeSource as AdminBadgeSource] : undefined;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="text-kov-concrete hover:text-kov-bone flex items-center gap-3 rounded-[10px] px-2 py-2.5 text-sm transition-colors aria-[current=page]:bg-black/[0.04] aria-[current=page]:text-kov-red"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
                    {item.icon}
                  </svg>
                  <span className="flex-1">{item.label}</span>
                  {!!badge && badge > 0 && (
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
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}
