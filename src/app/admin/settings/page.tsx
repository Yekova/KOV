import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBusinessInfo } from "@/lib/billing/businessInfo";
import { SettingsForm } from "./SettingsForm";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { ProfileForm } from "./ProfileForm";
import { OnlineToggle } from "@/components/admin/OnlineToggle";
import { EmailAccountConnection } from "@/components/admin/settings/EmailAccountConnection";

export const metadata: Metadata = { title: "Paramètres — Admin KOV" };

// La colonne profiles.ms_connected_email vient de la migration
// 20260908…, qui n'est PAS appliquée sur la base de production. La
// sélectionner dans la requête principale faisait échouer TOUTE la
// requête : `profile` revenait nul, et le formulaire de profil de cette
// page s'affichait vide en permanence — nom, titre et photo compris.
//
// Lue à part, la panne reste locale : sans la colonne on perd l'état de
// connexion Outlook, pas le profil. Et le jour où la migration passe, elle
// revient sans qu'une ligne change.
async function getMsConnectedEmail(userId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("ms_connected_email")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.ms_connected_email ?? null;
}

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const [businessInfo, { data: profile }, msConnectedEmail] = await Promise.all([
    getBusinessInfo(),
    supabaseAdmin
      .from("profiles")
      .select("full_name, display_title, phone, avatar_path, is_online")
      .eq("id", user.id)
      .maybeSingle(),
    getMsConnectedEmail(user.id),
  ]);

  return (
    <main className="px-6 py-10 max-w-4xl mx-auto w-full space-y-10">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Paramètres</h1>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-4">Mon profil</h2>
        <ProfileForm
          fullName={profile?.full_name ?? null}
          displayTitle={profile?.display_title ?? null}
          phone={profile?.phone ?? null}
          avatarUrl={getPublicAssetUrl(profile?.avatar_path)}
        />
      </section>

      <section className="border-t pt-8" style={{ borderColor: "var(--kov-border)" }}>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-2">Disponibilité</h2>
        <p className="text-kov-steel text-sm mb-6">
          Ce que vos clients lisent à côté de votre nom dans leur espace.
        </p>
        <OnlineToggle isOnline={profile?.is_online ?? false} />
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
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-2">Emails</h2>
        <p className="text-kov-steel text-sm mb-4">
          Modèles utilisés dans le composer, et vos signatures personnelles.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
          <a href="/admin/settings/email-templates" className="text-kov-red text-sm hover:underline">
            Gérer les modèles d&apos;emails →
          </a>
          <a href="/admin/settings/email-signatures" className="text-kov-red text-sm hover:underline">
            Gérer mes signatures →
          </a>
        </div>
        <Suspense fallback={null}>
          <EmailAccountConnection connectedEmail={msConnectedEmail} />
        </Suspense>
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
