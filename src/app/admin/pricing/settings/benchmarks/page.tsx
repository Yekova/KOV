import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getBenchmarks, getDefaultSettingsVersionId, getPricingCatalog } from "@/lib/pricing/catalog";
import { BenchmarksManager } from "./BenchmarksManager";

export const metadata: Metadata = { title: "Références de marché — Admin KOV" };

export default async function PricingBenchmarksPage() {
  await requireAdmin();

  const versionId = await getDefaultSettingsVersionId();
  const [benchmarks, catalog] = await Promise.all([
    getBenchmarks(),
    versionId ? getPricingCatalog(versionId) : Promise.resolve(null),
  ]);

  const stalenessDays = catalog?.settings.benchmarkStalenessDays ?? 180;

  return (
    <main className="px-6 py-10 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <Link
          href="/admin/pricing/settings"
          className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
        >
          ← Paramètres de pricing
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Références de marché</h1>
        <p className="text-kov-steel text-sm mt-1">
          Ce sont elles qui justifient un taux devant un client. Elles se saisissent à la main, avec leur source
          et leur date : aucun scraping, et rien qui se mette à jour tout seul sans que personne n&apos;ait
          regardé.
        </p>
      </div>

      <BenchmarksManager
        benchmarks={benchmarks}
        stalenessDays={stalenessDays}
        todayIso={new Date().toISOString().slice(0, 10)}
      />
    </main>
  );
}
