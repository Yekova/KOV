"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type PortalSearchItem = { label: string; sublabel: string; href: string };

// La recherche, dans la barre du haut plutôt qu'au milieu du tableau de bord.
//
// Elle vivait dans le panneau d'accueil : pour chercher une facture depuis
// la page Documents, il fallait retourner au tableau de bord. La loupe de la
// barre du haut, elle, était un lien vers ce tableau de bord déguisé en
// recherche. Ici, c'est la même chose partout, sur chaque écran du portail.
//
// ⌘K / Ctrl+K parce que c'est devenu le geste attendu, et qu'il ne coûte
// qu'un écouteur. La touche est annoncée dans le champ : un raccourci que
// rien n'affiche n'existe que pour ceux qui le connaissent déjà.

export function PortalSearch({ items }: { items: PortalSearchItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return items
      .filter((item) => item.label.toLowerCase().includes(needle) || item.sublabel.toLowerCase().includes(needle))
      .slice(0, 8);
  }, [items, query]);

  // L'index actif ne doit jamais dépasser la liste : taper une lettre de
  // plus raccourcit les résultats sous le curseur.
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const trimmed = query.trim();
  const showPanel = open && trimmed.length > 0;

  function go(item: PortalSearchItem) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(item.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[activeIndex]);
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-kov-concrete"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="kov-portal-search-results"
          aria-label="Rechercher dans votre espace"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Un délai avant la fermeture : sans lui, le blur provoqué par le
          // clic sur un résultat démonte le lien avant que le clic n'aboutisse.
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher un projet, un document, une facture…"
          className="h-11 w-full rounded-full border bg-white/[0.03] pl-11 pr-16 text-sm text-kov-bone outline-none transition-colors placeholder:text-kov-concrete/70 focus:border-kov-red"
          style={{ borderColor: "var(--kov-border)" }}
        />

        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-kov-concrete"
          style={{
            border: "1px solid var(--kov-border)",
            borderRadius: "var(--radius-sm)",
            padding: "2px 6px",
          }}
        >
          ⌘K
        </kbd>
      </div>

      {showPanel && (
        <div
          id="kov-portal-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 overflow-hidden border"
          style={{
            zIndex: "var(--z-modal)",
            background: "var(--kov-carbon)",
            borderColor: "var(--kov-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 24px 60px -30px rgba(0,0,0,0.9)",
          }}
        >
          {results.length === 0 ? (
            // Une recherche muette laisse croire qu'on a mal tapé.
            <p className="px-4 py-3 text-xs text-kov-concrete">
              Rien ne correspond à « {trimmed} » dans vos projets, documents, devis et factures.
            </p>
          ) : (
            results.map((item, index) => (
              <button
                key={`${item.href}-${item.label}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => go(item)}
                onMouseEnter={() => setActive(index)}
                className="block w-full px-4 py-2.5 text-left transition-colors"
                style={{ background: index === activeIndex ? "rgba(255,255,255,0.05)" : "transparent" }}
              >
                <span className="block truncate text-sm text-kov-bone">{item.label}</span>
                <span className="block text-xs text-kov-concrete">{item.sublabel}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
