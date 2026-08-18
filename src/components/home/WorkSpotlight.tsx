import { GlassCard } from "@/components/ui/GlassCard";
import { TagPill } from "@/components/ui/Chip";

// Placeholder spotlight (no case-study pages built yet) — reuses the Kanti
// example from docs/KOV-BRAND.md's portfolio guidance.
export function WorkSpotlight() {
  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <GlassCard className="md:col-span-2 min-h-[360px] flex items-end p-8">
          <p className="text-kov-steel font-mono text-xs uppercase tracking-widest">
            Visuel à venir — étude de cas en préparation
          </p>
        </GlassCard>

        <div className="flex flex-col justify-center">
          <p className="text-kov-red font-mono text-xs mb-2">Projet / 01</p>
          <h3 className="font-display text-kov-bone uppercase text-3xl mb-3">Kanti</h3>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-6">Gestion de patrimoine</p>
          <div className="flex flex-wrap gap-2 mb-8">
            <TagPill>Stratégie</TagPill>
            <TagPill>Design</TagPill>
            <TagPill>Développement</TagPill>
          </div>
          <span className="text-kov-steel text-xs uppercase tracking-widest">Voir l&apos;étude de cas → (bientôt)</span>
        </div>
      </div>
    </section>
  );
}
