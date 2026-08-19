import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Support — KOV",
};

export default async function ClientSupportPage() {
  await requireUser();

  return (
    <main className="px-6 md:px-10 py-10 max-w-[1400px] mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">Support</h1>
      <GlassCard className="p-8">
        <p className="text-kov-bone text-sm mb-2">
          Cette page arrive bientôt<span className="text-kov-red">.</span>
        </p>
        <p className="text-kov-steel text-sm mb-6">
          Pour toute question, envoyez une demande depuis l&apos;espace Demandes.
        </p>
        <Button href="/client/requests" variant="secondary">
          Aller aux demandes
        </Button>
        <div className="mt-4">
          <Link href="/contact" className="text-kov-steel text-xs hover:text-kov-red transition-colors">
            Ou contactez KOV directement →
          </Link>
        </div>
      </GlassCard>
    </main>
  );
}
