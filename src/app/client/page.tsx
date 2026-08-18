import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Espace client — KOV",
};

export default async function ClientPage() {
  await requireUser();

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-32">
      <GlassCard className="max-w-xl p-8 md:p-12 text-center">
        <p className="font-display text-kov-bone text-lg tracking-widest mb-6">KOV</p>
        <p className="text-kov-bone text-lg mb-8">
          Votre espace projet est en préparation<span className="text-kov-red">.</span> On revient vers vous très
          bientôt.
        </p>
        <form action={logout}>
          <Button type="submit" variant="ghost">
            Se déconnecter
          </Button>
        </form>
      </GlassCard>
    </main>
  );
}
