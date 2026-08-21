import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Mon profil — KOV" };

export default async function ClientProfilePage() {
  const user = await requireUser();
  const { data: profile } = await supabaseAdmin.from("profiles").select("full_name, company, email").eq("id", user.id).maybeSingle();

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1000px] mx-auto w-full space-y-8">
      <h1 className="font-display text-kov-bone text-2xl uppercase">Mon profil</h1>

      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-1">Email</p>
        <p className="text-kov-bone text-sm mb-6">{profile?.email}</p>
        <ProfileForm fullName={profile?.full_name ?? null} company={profile?.company ?? null} />
      </GlassCard>

      <GlassCard className="p-6">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Mot de passe</p>
        <PasswordForm />
      </GlassCard>
    </main>
  );
}
