import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBusinessInfo } from "@/lib/billing/businessInfo";
import { SettingsForm } from "./SettingsForm";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Paramètres — Admin KOV" };

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const [businessInfo, { data: profile }] = await Promise.all([
    getBusinessInfo(),
    supabaseAdmin.from("profiles").select("full_name, display_title").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-10">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Paramètres</h1>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Mon profil</h2>
        <ProfileForm fullName={profile?.full_name ?? null} displayTitle={profile?.display_title ?? null} />
      </section>

      <section className="border-t pt-8" style={{ borderColor: "var(--kov-border)" }}>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-2">Identité légale & facturation</h2>
        <p className="text-kov-steel text-sm mb-6">
          Ces informations apparaissent sur chaque facture, devis et email envoyés aux clients.
        </p>
        <SettingsForm businessInfo={businessInfo} />
      </section>

      <section className="border-t pt-8" style={{ borderColor: "var(--kov-border)" }}>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-2">Leads</h2>
        <p className="text-kov-steel text-sm mb-4">
          Statuts du pipeline commercial — ajoutez, renommez ou réordonnez les étapes.
        </p>
        <a href="/admin/settings/lead-statuses" className="text-kov-red text-sm hover:underline">
          Gérer les statuts des leads →
        </a>
      </section>

      <section className="border-t pt-8" style={{ borderColor: "var(--kov-border)" }}>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-2">À venir</h2>
        <p className="text-kov-steel text-sm">
          Intégrations et permissions granulaires arrivent dans une prochaine phase. La gestion d&apos;équipe se fait
          désormais depuis <a href="/admin/team" className="text-kov-red hover:underline">Équipe</a>.
        </p>
      </section>
    </main>
  );
}
