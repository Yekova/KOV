"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export type PortalSearchItem = { label: string; sublabel: string; href: string };

const SUGGESTIONS: { label: string; href: string }[] = [
  { label: "Où en est mon projet ?", href: "/client/projects" },
  { label: "Télécharger ma dernière facture", href: "/client/invoices" },
  { label: "Contacter mon chef de projet", href: "/client/requests" },
];

export function GreetingSearchPanel({
  fullName,
  searchIndex,
}: {
  fullName: string | null;
  searchIndex: PortalSearchItem[];
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(q) || item.sublabel.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, searchIndex]);

  return (
    <GlassCard className="p-8 md:p-10">
      <p className="text-kov-red text-xs uppercase tracking-widest mb-2">
        Bonjour{fullName ? ` ${fullName.split(" ")[0]}` : ""}
      </p>
      <h1 className="font-display text-kov-bone uppercase mb-3" style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}>
        Bienvenue dans
        <br />
        votre espace client
      </h1>
      <p className="text-kov-steel text-sm mb-8 max-w-md">
        Retrouvez ici l&apos;ensemble de vos projets, échanges et documents au même endroit.
      </p>

      <div className="relative mb-6">
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Posez une question ou recherchez quelque chose…"
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

      <p className="text-kov-steel text-xs uppercase tracking-widest mb-3">Requêtes fréquentes</p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="px-3 py-1.5 border text-xs text-kov-bone hover:border-kov-red hover:text-kov-red transition-colors"
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </GlassCard>
  );
}
