import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getPricingCatalog, getDefaultSettingsVersionId } from "@/lib/pricing/catalog";
import { computeCostOfSale } from "@/lib/pricing/costOfSale";
import { formatEuros } from "@/lib/pricing/money";
import { RolesManager } from "./RolesManager";

export const metadata: Metadata = { title: "Rôles et taux — Admin KOV" };

export default async function PricingRolesPage() {
  await requireAdmin();

  const versionId = await getDefaultSettingsVersionId();
  const catalog = versionId ? await getPricingCatalog(versionId) : null;

  if (!catalog) {
    return (
      <main className="px-6 py-10 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Rôles et taux</h1>
        <p className="text-kov-steel text-sm mt-4">
          Aucune version tarifaire n&apos;est chargée. Les migrations du module de pricing n&apos;ont pas encore
          été appliquées.
        </p>
      </main>
    );
  }

  const cost = computeCostOfSale(catalog.settings);

  return (
    <main className="px-6 py-10 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <Link
          href="/admin/pricing/settings"
          className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
        >
          ← Paramètres de pricing
        </Link>
        <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Rôles et taux</h1>
        <p className="text-kov-steel text-sm mt-1">
          Les taux sont en base 2027. L&apos;indexation de la version tarifaire les déplace tous ensemble, avec
          les prix de référence et les bandes de marché : il n&apos;y a donc pas de taux à ressaisir chaque année.
        </p>
      </div>

      {/* Le coût de revient est le repère qui donne son sens à la colonne
          « taux de vente ». Le rappeler ici évite d'avoir à ouvrir un autre
          écran pour savoir si 380 € est beaucoup ou peu. */}
      <p className="text-kov-steel text-sm">
        Coût de revient interne, version « {catalog.settings.label} » : {formatEuros(cost.dayRateCents)} par jour.
        Un taux de vente en dessous se vend à perte, quel que soit le volume.
      </p>

      <RolesManager
        roles={catalog.roles}
        indexationBp={catalog.settings.indexationBp}
        internalDayRateCents={cost.dayRateCents}
      />
    </main>
  );
}
