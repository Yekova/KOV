import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { ShowcaseList } from "./ShowcaseList";

export const metadata: Metadata = { title: "Réalisations — Admin KOV" };

export default async function AdminRealisationsPage() {
  await requireAdmin();

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Réalisations</h1>
          <p className="text-kov-steel text-sm mt-1">
            Le portfolio public — /projets, la grille de l&apos;accueil et le projet mis en avant du hero.
          </p>
        </div>
        <Button href="/admin/realisations/new" variant="primary">
          Nouvelle réalisation
        </Button>
      </div>

      <ShowcaseList />
    </main>
  );
}
