import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Équipe KOV — KOV",
};

export default async function ClientTeamPage() {
  await requireUser();

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Équipe KOV</h1>
      <GlassCard className="p-8">
        <p className="text-kov-bone text-sm mb-2">
          Cette page arrive bientôt<span className="text-kov-red">.</span>
        </p>
        <p className="text-kov-steel text-sm">
          En attendant, retrouvez votre chef de projet directement sur votre tableau de bord.
        </p>
      </GlassCard>
    </main>
  );
}
