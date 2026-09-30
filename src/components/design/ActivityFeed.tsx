"use client";

import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { DesignActivityEntry } from "@/lib/design/types";

// Le journal du projet (§30/§49).
//
// Il ne se lit pas comme un état courant mais comme une suite de faits
// datés : design_activity.summary est figé à l'écriture, exactement comme
// activity_log.title. Renommer une page ne réécrit donc pas l'histoire —
// « Page « Accueil » validée » reste vrai même si elle s'appelle
// autrement aujourd'hui.
//
// Rien ne s'y supprime : c'est la condition pour qu'il serve de preuve
// dans un désaccord.

const SIDE_COLORS: Record<string, string> = {
  client: "var(--kov-status-blue)",
  admin: "var(--kov-red)",
  system: "var(--kov-steel)",
};

export function ActivityFeed({ entries }: { entries: DesignActivityEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <details className="kov-card px-4 py-3">
      <summary className="text-kov-steel cursor-pointer text-[11px] tracking-widest uppercase">
        Journal du projet ({entries.length})
      </summary>
      <ul className="mt-4 space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-baseline gap-3">
            <span
              className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: SIDE_COLORS[entry.actorSide] ?? "var(--kov-steel)" }}
              aria-hidden="true"
            />
            <span className="text-kov-concrete flex-1 text-[13px] leading-relaxed">
              {entry.summary}
              {entry.actorName && <span className="text-kov-steel"> — {entry.actorName}</span>}
            </span>
            <span className="text-kov-steel shrink-0 text-[10px]">{formatRelativeTime(entry.createdAt)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
