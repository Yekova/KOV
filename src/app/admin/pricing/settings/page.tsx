import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { CostOfSaleCard } from "@/components/admin/pricing/CostOfSaleCard";
import { getPricingCatalog, getDefaultSettingsVersionId, listSettingsVersions } from "@/lib/pricing/catalog";
import { computeCostOfSale } from "@/lib/pricing/costOfSale";
import { SettingsVersionForm } from "./SettingsVersionForm";

export const metadata: Metadata = { title: "Paramètres de pricing — Admin KOV" };

export default async function PricingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ version?: string }>;
}) {
  await requireAdmin();
  const { version } = await searchParams;

  const versions = await listSettingsVersions();
  const activeId = version && versions.some((v) => v.id === version) ? version : await getDefaultSettingsVersionId();
  const catalog = activeId ? await getPricingCatalog(activeId) : null;

  if (!catalog || !activeId) {
    return (
      <main className="px-6 py-10 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Paramètres de pricing</h1>
        <p className="text-kov-steel text-sm mt-4">
          Aucune version tarifaire n&apos;est chargée. Les migrations du module de pricing n&apos;ont
          probablement pas encore été appliquées.
        </p>
      </main>
    );
  }

  const cost = computeCostOfSale(catalog.settings);

  return (
    <main className="px-6 py-10 max-w-5xl mx-auto w-full space-y-8">
      <div>
        <Link
          href="/admin/pricing"
          className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
        >
          ← Pricing
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Paramètres de pricing</h1>
        <p className="text-kov-steel text-sm mt-1">
          Une version tarifaire est un jeu complet de paramètres à une date. Les configurations déjà chiffrées
          gardent celle avec laquelle elles ont été créées.
        </p>
      </div>

      {/* Le sélecteur d'année. Volontairement des liens et non un Select :
          changer d'année change tout l'écran, ce qui est une navigation. */}
      <div className="flex flex-wrap gap-2">
        {versions.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <Link
              key={entry.id}
              href={`/admin/pricing/settings?version=${entry.id}`}
              className="px-4 py-2 border text-xs uppercase tracking-widest transition-colors"
              style={{
                borderColor: isActive ? "var(--kov-red)" : "var(--kov-border)",
                borderRadius: "var(--radius-sm)",
                color: isActive ? "var(--kov-red)" : undefined,
              }}
            >
              {entry.label}
              {!entry.contributionRateConfirmed && <span className="ml-2 text-kov-steel normal-case">non confirmé</span>}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CostOfSaleCard settings={catalog.settings} cost={cost} />

        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Le reste du catalogue</p>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/admin/pricing/settings/roles" className="text-kov-bone hover:text-kov-red transition-colors">
                Rôles et taux
              </Link>
              <p className="text-kov-steel text-xs mt-0.5">
                {catalog.roles.length} rôles. Les taux sont en base 2027 : l&apos;indexation de la version les
                déplace tous ensemble.
              </p>
            </li>
            <li>
              <Link href="/admin/pricing/grille" className="text-kov-bone hover:text-kov-red transition-colors">
                La grille et son calibrage
              </Link>
              <p className="text-kov-steel text-xs mt-0.5">
                {catalog.offers.length} offres, {catalog.modules.length} modules. Chaque offre confrontée à son
                prix de référence et à sa marge.
              </p>
            </li>
            <li>
              <Link
                href="/admin/pricing/settings/benchmarks"
                className="text-kov-bone hover:text-kov-red transition-colors"
              >
                Références de marché
              </Link>
              <p className="text-kov-steel text-xs mt-0.5">
                Saisies à la main, avec leur source et leur date. Aucun scraping.
              </p>
            </li>
          </ul>
        </GlassCard>
      </div>

      <SettingsVersionForm versionId={activeId} settings={catalog.settings} />
    </main>
  );
}
