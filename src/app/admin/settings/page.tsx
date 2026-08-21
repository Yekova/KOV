import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getBusinessInfo } from "@/lib/billing/businessInfo";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Paramètres — Admin KOV" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const businessInfo = await getBusinessInfo();

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-10">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Paramètres</h1>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-2">Identité légale & facturation</h2>
        <p className="text-kov-steel text-sm mb-6">
          Ces informations apparaissent sur chaque facture, devis et email envoyés aux clients.
        </p>
        <SettingsForm businessInfo={businessInfo} />
      </section>

      <section className="border-t pt-8" style={{ borderColor: "var(--kov-border)" }}>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-2">À venir</h2>
        <p className="text-kov-steel text-sm">
          Gestion d&apos;équipe, notifications, intégrations et permissions arrivent dans une prochaine phase.
        </p>
      </section>
    </main>
  );
}
