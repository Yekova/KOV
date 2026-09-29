import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBusinessInfo } from "@/lib/billing/businessInfo";
import { SettingsForm } from "./SettingsForm";
import { getPublicAssetUrl } from "@/lib/portal/storage";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "@/components/auth/PasswordForm";
import { OnlineToggle } from "@/components/admin/OnlineToggle";
import { EmailAccountConnection } from "@/components/admin/settings/EmailAccountConnection";

export const metadata: Metadata = { title: "Paramètres — Admin KOV" };

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  const [businessInfo, { data: profile }] = await Promise.all([
    getBusinessInfo(),
    supabaseAdmin
      .from("profiles")
      .select("full_name, display_title, phone, email, avatar_path, is_online, ms_connected_email")
      .eq("id", user.id)
      .maybeSingle(),
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

      {/* Le compte : l'adresse et le mot de passe.
          Le studio n'avait aucun moyen de changer son mot de passe depuis
          l'interface — le formulaire existait, mais seulement dans le
          portail client. Il est maintenant partagé (components/auth). */}
      <section className="border-t pt-8" style={{ borderColor: "var(--kov-border)" }}>
        <h2 className="text-xs uppercase tracking-widest text-kov-steel mb-2">Compte</h2>
        <p className="text-kov-steel text-sm mb-6">
          Adresse de connexion : <span className="text-kov-bone">{profile?.email ?? "—"}</span>. La modifier demande
          une vérification par email, qui n&apos;est pas encore branchée — écrivez-moi si elle doit changer.
        </p>
        <PasswordForm />
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
          <EmailAccountConnection connectedEmail={profile?.ms_connected_email ?? null} />
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
