import { GlassCard } from "@/components/ui/GlassCard";

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;

  const width = 100;
  const height = 32;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;

  const coords = points.map((value, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline points={coords.join(" ")} fill="none" stroke="var(--kov-red)" strokeWidth="2" />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  evolutionPercent,
  isNew,
  evolutionCaption,
  sparkline,
}: {
  label: string;
  value: string;
  evolutionPercent: number | null;
  isNew: boolean;
  evolutionCaption: string;
  sparkline: number[];
}) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">{label}</p>
      <p className="font-display text-kov-bone text-3xl mb-3">{value}</p>
      <p className="text-xs mb-3" style={{ color: evolutionPercent !== null && evolutionPercent < 0 ? "var(--kov-steel)" : "var(--kov-red)" }}>
        {isNew ? "Nouveau" : evolutionPercent !== null ? `${evolutionPercent > 0 ? "+" : ""}${evolutionPercent}% ${evolutionCaption}` : "—"}
      </p>
      <Sparkline points={sparkline} />
    </GlassCard>
  );
}
