import { GlassCard } from "@/components/ui/GlassCard";

export function QuoteStatCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">{label}</p>
      <p className="font-display text-kov-bone text-3xl mb-2">{value}</p>
      <p className="text-kov-steel text-xs">{caption}</p>
    </GlassCard>
  );
}
