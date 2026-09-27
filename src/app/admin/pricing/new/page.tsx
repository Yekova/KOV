import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getDefaultSettingsVersionId,
  getOldestBenchmarkDate,
  getPricingCatalog,
  listSettingsVersions,
} from "@/lib/pricing/catalog";
import { PricingConfigurator, type ConfiguratorPerson } from "./PricingConfigurator";

export const metadata: Metadata = { title: "Nouveau chiffrage — Admin KOV" };

export default async function NewPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ version?: string }>;
}) {
  await requireAdmin();
  const { version } = await searchParams;

  const versions = await listSettingsVersions();
  const activeId = version && versions.some((v) => v.id === version) ? version : await getDefaultSettingsVersionId();

  const [catalog, oldestBenchmark, { data: clientRows }, { data: leadRows }] = await Promise.all([
    activeId ? getPricingCatalog(activeId) : Promise.resolve(null),
    getOldestBenchmarkDate(),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, company, archived_at")
      .eq("role", "client")
      .order("full_name", { ascending: true }),
    supabaseAdmin
      .from("leads")
      .select("id, name, company, converted_profile_id")
      .is("converted_profile_id", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!catalog || !activeId) {
    return (
      <main className="px-6 py-10 max-w-4xl mx-auto w-full">
        <h1 className="font-display text-kov-bone text-2xl uppercase">Nouveau chiffrage</h1>
        <p className="text-kov-steel text-sm mt-4">
          Aucune version tarifaire n&apos;est chargée. Les migrations du module de pricing n&apos;ont pas été
          appliquées.
        </p>
      </main>
    );
  }

  // Un client archivé ne disparaît pas de la base, mais il n'a rien à faire
  // dans une liste de destinataires : on ne chiffre pas pour quelqu'un dont
  // la relation est close.
  const clients: ConfiguratorPerson[] = (clientRows ?? [])
    .filter((row) => !row.archived_at)
    .map((row) => ({
      id: row.id as string,
      name: (row.full_name as string | null) ?? "Sans nom",
      company: (row.company as string | null) ?? null,
    }));

  const leads: ConfiguratorPerson[] = (leadRows ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    company: (row.company as string | null) ?? null,
  }));

  return (
    <main className="px-6 py-10 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/pricing"
            className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
          >
            ← Pricing
          </Link>
          <h1 className="font-display text-kov-bone text-2xl uppercase mt-4">Nouveau chiffrage</h1>
          <p className="text-kov-steel text-sm mt-1">
            Paramètres « {catalog.settings.label} ». Le prix se recalcule à chaque case cochée.
          </p>
        </div>

        {versions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {versions.map((entry) => (
              <Link
                key={entry.id}
                href={`/admin/pricing/new?version=${entry.id}`}
                className="px-3 py-1.5 border text-[11px] uppercase tracking-widest transition-colors"
                style={{
                  borderColor: entry.id === activeId ? "var(--kov-red)" : "var(--kov-border)",
                  borderRadius: "var(--radius-sm)",
                  color: entry.id === activeId ? "var(--kov-red)" : undefined,
                }}
              >
                {entry.year}
              </Link>
            ))}
          </div>
        )}
      </div>

      <PricingConfigurator
        catalog={catalog}
        settingsVersionId={activeId}
        clients={clients}
        leads={leads}
        oldestBenchmarkConsultedAt={oldestBenchmark}
        todayIso={new Date().toISOString().slice(0, 10)}
      />
    </main>
  );
}
