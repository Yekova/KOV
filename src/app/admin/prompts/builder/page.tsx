import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PromptBuilder } from "../PromptBuilder";

export const metadata: Metadata = { title: "Prompt Builder — Admin KOV" };

export default async function PromptBuilderPage() {
  await requireAdmin();

  return (
    <main className="px-6 py-10 max-w-[1800px] mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Prompt Builder</h1>
          <p className="text-kov-steel text-sm mt-1">
            Empilez des blocs réutilisables pour composer un prompt neuf.
          </p>
        </div>
        <Link href="/admin/prompts" className="text-kov-steel hover:text-kov-red text-sm transition-colors">
          ← Bibliothèque
        </Link>
      </div>

      <PromptBuilder />
    </main>
  );
}
