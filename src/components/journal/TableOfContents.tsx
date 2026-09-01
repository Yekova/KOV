"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/journal/toc";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;

    const elements = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        setActiveId(topMost.target.id);
      },
      { rootMargin: "-15% 0% -55% 0%" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav aria-label="Table des matières">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">Sommaire</p>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block py-1.5 text-sm leading-snug transition-colors border-l-2 ${item.level === 3 ? "pl-3" : "pl-3"}`}
                style={{
                  borderColor: active ? "var(--kov-red)" : "transparent",
                  color: active ? "var(--kov-bone)" : "var(--kov-steel)",
                  fontSize: item.level === 3 ? "0.8rem" : "0.875rem",
                  paddingLeft: item.level === 3 ? "1.5rem" : "0.75rem",
                }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
