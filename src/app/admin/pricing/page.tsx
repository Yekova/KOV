import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { getDefaultSettingsVersionId, getPricingCatalog, getOldestBenchmarkDate } from "@/lib/pricing/catalog";
import { computeCostOfSale } from "@/lib/pricing/costOfSale";
import { formatEuros } from "@/lib/pricing/money";

export const metadata: Metadata = { title: "Pricing — Admin KOV" };

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  quoted: "Devis généré",
  lost: "Perdu",
};

export default async function PricingPage() {
  await requireAdmin();

  const versionId = await getDefaultSettingsVersionId();
  const [catalog, oldestBenchmark, { data: configurations }] = await Promise.all([
    versionId ? getPricingCatalog(versionId) : Promise.resolve(null),
    getOldestBenchmarkDate(),
    supabaseAdmin
      .from("pricing_configurations")
      .select("id, title, status, version, created_at, snapshot")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  if (!catalog) {
    return (
      <main className="px-6 py-10 max-w-5xl mx-auto w-full">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Pricing</h1>
        <GlassCard className="p-6 mt-6">
          <p className="text-kov-bone text-sm">Le module de pricing n&apos;est pas encore actif.</p>
          <p className="text-kov-steel text-sm mt-2">
            Les migrations <code className="text-kov-concrete">20260927100000</code> à{" "}
            <code className="text-kov-concrete">20260927100200</code> n&apos;ont pas été appliquées. Elles créent le
            schéma et chargent le catalogue de départ.
          </p>
        </GlassCard>
      </main>
    );
  }

  const cost = computeCostOfSale(catalog.settings);
  const rows = configurations ?? [];

  const now = new Date();
  const benchmarkAgeDays = oldestBenchmark
    ? Math.floor((now.getTime() - new Date(`${oldestBenchmark}T00:00:00`).getTime()) / 86_400_000)
    : null;

  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-kov-bone text-2xl uppercase">Pricing</h1>
          <p className="text-kov-steel text-sm mt-1">
            Un prix KOV se compose de jours de production et de taux, puis se confronte au coût de revient et au
            marché. Aucun montant ne se saisit à la main.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-5">
          <p className="text-kov-steel text-[11px] uppercase tracking-widest">Coût de revient</p>
          <p className="font-display text-kov-bone text-2xl tabular-nums mt-2">{formatEuros(cost.dayRateCents)}</p>
          <p className="text-kov-steel text-xs mt-1">par jour · {catalog.settings.label}</p>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-kov-steel text-[11px] uppercase tracking-widest">TJM plancher</p>
          <p className="font-display text-kov-bone text-2xl tabular-nums mt-2">
            {formatEuros(catalog.settings.floorDayRateCents)}
          </p>
          <p className="text-kov-steel text-xs mt-1">
            sous ce seuil, un chiffrage est signalé
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="text-kov-steel text-[11px] uppercase tracking-widest">Références de marché</p>
          <p className="font-display text-kov-bone text-2xl tabular-nums mt-2">
            {benchmarkAgeDays === null ? "—" : `${benchmarkAgeDays} j`}
          </p>
          <p className="text-kov-steel text-xs mt-1">
            {benchmarkAgeDays === null
              ? "aucune référence saisie"
              : benchmarkAgeDays > catalog.settings.benchmarkStalenessDays
                ? "la plus ancienne est à rafraîchir"
                : "âge de la plus ancienne"}
          </p>
        </GlassCard>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/admin/pricing/grille" className="text-kov-red text-sm hover:underline">
          Voir la grille et son calibrage →
        </Link>
        <Link href="/admin/pricing/settings" className="text-kov-red text-sm hover:underline">
          Paramètres de pricing →
        </Link>
        <Link href="/admin/pricing/settings/benchmarks" className="text-kov-red text-sm hover:underline">
          Références de marché →
        </Link>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Chiffrages</h2>
        {rows.length === 0 ? (
          <EmptyState message="Aucun chiffrage. Le configurateur arrive à la prochaine étape ; en attendant, la grille montre ce que produit chaque offre par défaut." />
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => {
              const snapshot = row.snapshot as { priceExclVatCents?: number } | null;
              return (
                <li key={row.id as string}>
                  <Link
                    href={`/admin/pricing/${row.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-3 border px-4 py-3 transition-colors hover:border-kov-red"
                    style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
                  >
                    <span className="text-kov-bone text-sm">
                      {row.title as string}
                      {(row.version as number) > 1 && (
                        <span className="text-kov-steel"> · v{row.version as number}</span>
                      )}
                    </span>
                    <span className="text-kov-steel text-xs tabular-nums">
                      {STATUS_LABELS[row.status as string] ?? (row.status as string)}
                      {snapshot?.priceExclVatCents != null && <> · {formatEuros(snapshot.priceExclVatCents)} HT</>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
