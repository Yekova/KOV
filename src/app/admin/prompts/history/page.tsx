import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { getPromptUsage } from "../actions";

export const metadata: Metadata = { title: "Historique d'usage — Admin KOV" };

// Composant serveur : il n'y a rien à filtrer ni à muter ici, seulement un
// journal à lire. Le reste du module passe par TanStack Query parce qu'il
// écrit ; cette page n'écrit pas.
export default async function PromptHistoryPage() {
  await requireAdmin();
  const usage = await getPromptUsage();

  return (
    <main className="px-6 py-10 max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Historique d&apos;usage</h1>
          <p className="text-kov-steel text-sm mt-1">
            Quelle version a servi, quand, et sur quel projet. Les cent dernières générations.
          </p>
        </div>
        <Link href="/admin/prompts" className="text-kov-steel hover:text-kov-red text-sm transition-colors">
          ← Bibliothèque
        </Link>
      </div>

      {usage.length === 0 ? (
        <div
          className="border border-dashed p-10 text-center"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          <p className="text-kov-bone text-sm">Aucune génération enregistrée.</p>
          <p className="text-kov-steel text-sm mt-2">
            Le journal se remplit à chaque fois qu&apos;un prompt est généré depuis la bibliothèque.
          </p>
        </div>
      ) : (
        <div className="border overflow-x-auto" style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}>
          <table className="w-full text-sm text-left">
            <thead>
              <tr
                className="text-xs uppercase tracking-widest text-kov-steel border-b"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <th className="px-4 py-3">Prompt</th>
                <th className="px-4 py-3 w-20">Version</th>
                <th className="px-4 py-3">Projet</th>
                <th className="px-4 py-3">Par</th>
                <th className="px-4 py-3 w-32">Quand</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0" style={{ borderColor: "var(--kov-border)" }}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/prompts/${entry.promptId}`}
                      className="text-kov-bone hover:text-kov-red transition-colors"
                    >
                      {entry.promptTitle}
                    </Link>
                    {Object.keys(entry.variables).length > 0 && (
                      <p className="text-kov-steel text-xs mt-0.5 line-clamp-1">
                        {Object.entries(entry.variables)
                          .map(([key, value]) => `${key} : ${value}`)
                          .join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-kov-concrete text-xs tabular-nums">
                    {entry.versionNumber ? `v${entry.versionNumber}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-kov-steel text-xs">{entry.projectName ?? "—"}</td>
                  <td className="px-4 py-3 text-kov-steel text-xs">{entry.userName ?? "—"}</td>
                  <td className="px-4 py-3 text-kov-steel text-xs">{formatRelativeTime(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
