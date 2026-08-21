import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Analytics — Admin KOV" };

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Analytics</h1>

      <GlassCard className="p-8">
        <p className="text-kov-red text-xs uppercase tracking-widest mb-3">Vercel Web Analytics — connecté</p>
        <p className="text-kov-bone text-sm mb-4">
          Le site envoie désormais ses données de trafic (pages vues, visiteurs, référents) à Vercel Web Analytics,
          ainsi que ses métriques de performance à Vercel Speed Insights.
        </p>
        <p className="text-kov-steel text-sm mb-6">
          Vercel ne fournit pas d&apos;API publique pour réafficher ces données ailleurs que sur son propre tableau
          de bord — impossible d&apos;intégrer un vrai graphique ici sans réinventer les chiffres. Le tableau de bord
          Vercel reste donc la source de vérité pour cette page.
        </p>
        <Button href="https://vercel.com/dashboard" variant="secondary">
          Ouvrir le tableau de bord Vercel →
        </Button>
      </GlassCard>
    </main>
  );
}
