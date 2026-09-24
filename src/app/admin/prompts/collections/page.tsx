import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { CollectionsManager } from "../CollectionsManager";

export const metadata: Metadata = { title: "Classement et packs — Admin KOV" };

export default async function PromptCollectionsPage() {
  await requireAdmin();

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Classement et packs</h1>
          <p className="text-kov-steel text-sm mt-1">
            Le classement de la bibliothèque, et les jeux de gabarits prêts à poser.
          </p>
        </div>
        <Link href="/admin/prompts" className="text-kov-steel hover:text-kov-red text-sm transition-colors">
          ← Bibliothèque
        </Link>
      </div>
      <CollectionsManager />
    </main>
  );
}
