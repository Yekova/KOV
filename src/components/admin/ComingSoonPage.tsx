import { GlassCard } from "@/components/ui/GlassCard";

export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <main className="px-6 py-10 max-w-6xl mx-auto w-full">
      <h1 className="font-display text-kov-bone text-2xl uppercase mb-8">{title}</h1>
      <GlassCard className="p-8">
        <p className="text-kov-bone text-sm mb-2">
          Cette section arrive bientôt<span className="text-kov-red">.</span>
        </p>
        <p className="text-kov-steel text-sm">{description}</p>
      </GlassCard>
    </main>
  );
}
