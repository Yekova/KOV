import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { downloadDocument } from "@/app/client/documents/actions";

export type RecentDocument = {
  id: string;
  filename: string;
  sizeBytes: number | null;
  createdAt: string;
};

// Les derniers documents, avec le bouton qui sert.
//
// Le poids est affiché parce qu'un client qui télécharge depuis un
// téléphone en déplacement veut savoir avant de cliquer, et parce qu'il est
// en base. Il n'est pas affiché quand il est nul : « 0 Ko » est faux, pas
// discret.
function formatSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

export function RecentDocuments({ documents }: { documents: RecentDocument[] }) {
  return (
    <GlassCard className="flex flex-col p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xs uppercase tracking-widest text-kov-concrete">Documents récents</h2>
        {documents.length > 0 && (
          <Link href="/client/documents" className="text-xs uppercase tracking-widest text-kov-red hover:underline">
            Voir tous →
          </Link>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-kov-concrete">
          Aucun document pour l&apos;instant. Les livrables et pièces du projet arrivent ici.
        </p>
      ) : (
        <ul className="space-y-1">
          {documents.map((document) => {
            const size = formatSize(document.sizeBytes);
            return (
              <li
                key={document.id}
                className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
                style={{ borderColor: "var(--kov-border)" }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                  className="shrink-0 text-kov-concrete"
                >
                  <path d="M7 3h7l5 5v13H7z" />
                  <path d="M14 3v5h5" />
                </svg>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-kov-bone">{document.filename}</span>
                  <span className="block text-xs text-kov-concrete">
                    {formatRelativeTime(document.createdAt)}
                    {size && ` · ${size}`}
                  </span>
                </span>

                <form action={downloadDocument} className="shrink-0">
                  <input type="hidden" name="document_id" value={document.id} />
                  <Button type="submit" variant="ghost" aria-label={`Télécharger ${document.filename}`}>
                    ↓
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
