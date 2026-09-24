import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PromptLibrary } from "./PromptLibrary";

export const metadata: Metadata = { title: "Prompts — Admin KOV" };

export default async function PromptsPage() {
  await requireAdmin();

  return (
    <main className="px-6 py-10 max-w-[1800px] mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Bibliothèque de prompts</h1>
          <p className="text-kov-steel text-sm mt-1">
            Prompts, systèmes et workflows réutilisables pour la création de site, le développement et le contenu.
          </p>
        </div>
        <Link
          href="/admin/prompts/new"
          className="inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-widest text-kov-white transition-colors"
          style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
        >
          <Plus size={14} /> Nouveau prompt
        </Link>
      </div>

      {/* PromptLibrary lit useSearchParams() pour le lien « utiliser » de la
          palette de commandes, et Next exige qu'un composant qui le fait
          soit rendu sous une frontière Suspense. */}
      <Suspense fallback={<p className="text-kov-steel text-sm">Chargement de la bibliothèque…</p>}>
        <PromptLibrary />
      </Suspense>
    </main>
  );
}
