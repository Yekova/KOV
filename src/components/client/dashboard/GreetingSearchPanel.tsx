"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export type PortalSearchItem = { label: string; sublabel: string; href: string };

// Des raccourcis, et ils s'annoncent comme tels.
//
// Ils s'appelaient « Requêtes fréquentes » et étaient libellés en questions
// — « Où en est mon projet ? » — au-dessus d'un champ qui invitait à poser
// une question. Trois liens de navigation déguisés en assistant. Ce sont
// des liens : ils portent maintenant le nom de leur destination.
const SHORTCUTS: { label: string; href: string }[] = [
  { label: "Mes projets", href: "/client/projects" },
  { label: "Mes factures", href: "/client/invoices" },
  { label: "Écrire au studio", href: "/client/requests" },
];

// L'en-tête du tableau de bord.
//
// Il occupait trois registres avant la moindre information : « Bonjour X »,
// puis « Bienvenue dans votre espace client » en taille display, puis
// « Retrouvez ici l'ensemble de vos projets, échanges et documents au même
// endroit ». Le <h1> — la plus grosse chose de l'écran, à chaque visite —
// n'apprenait rien, et repoussait sous la ligne de flottaison la seule
// carte qui appelle une action.
//
// Il en reste une ligne, qui dit au moins qui est connecté.
export function GreetingSearchPanel({
  fullName,
  searchIndex,
  /** Vrai quand on arrive par la loupe de la barre du haut (/client?search=1) :
   *  le geste doit aboutir dans le champ, pas à côté. */
  focusSearch = false,
}: {
  fullName: string | null;
  searchIndex: PortalSearchItem[];
  focusSearch?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusSearch) inputRef.current?.focus();
  }, [focusSearch]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(q) || item.sublabel.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, searchIndex]);

  const trimmed = query.trim();

  return (
    <GlassCard className="p-6 md:p-8">
      <h1
        className="font-display text-kov-bone uppercase"
        style={{ fontSize: "clamp(22px, 2.6vw, 34px)", lineHeight: 1.1, letterSpacing: "-0.02em" }}
      >
        Bonjour{fullName ? ` ${fullName.split(" ")[0]}` : ""}
        <span className="text-kov-red">.</span>
      </h1>

      <div className="relative mt-6">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-kov-steel pointer-events-none"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // « Posez une question ou recherchez quelque chose… » promettait
          // une réponse. C'est un filtre sur des noms : il dit maintenant
          // sur quoi il filtre.
          placeholder="Rechercher un projet, un document, un devis, une facture…"
          aria-label="Rechercher dans votre espace"
          className="w-full bg-transparent border py-3.5 pl-11 pr-4 text-kov-bone text-sm focus:outline-none focus:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
        />
        {results.length > 0 && (
          <div
            className="absolute left-0 right-0 top-full mt-2 border overflow-hidden"
            style={{
              zIndex: "var(--z-modal)",
              background: "var(--kov-carbon)",
              borderColor: "var(--kov-border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {results.map((r) => (
              <Link
                key={`${r.href}-${r.label}`}
                href={r.href}
                className="block px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
              >
                <p className="text-kov-bone text-sm">{r.label}</p>
                <p className="text-kov-steel text-xs">{r.sublabel}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Une recherche qui ne trouve rien doit le dire. Sans ça, le champ
          reste muet et on ne sait pas si l'on a mal tapé ou si l'objet
          n'existe pas. */}
      {trimmed.length > 0 && results.length === 0 && (
        <p role="status" className="mt-2 text-kov-steel text-xs">
          Rien ne correspond à « {trimmed} » dans vos projets, documents, devis et factures.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="px-3 py-2 border text-xs text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}
