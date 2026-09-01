import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { ArticlesList } from "./ArticlesList";

export const metadata: Metadata = { title: "Contenu — Admin KOV" };

export default async function AdminContentPage() {
  await requireAdmin();

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Contenu</h1>
        <Button href="/admin/content/new" variant="primary">
          Nouvel article
        </Button>
      </div>

      <ArticlesList />
    </main>
  );
}
