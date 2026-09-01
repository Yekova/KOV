import { GlassCard } from "@/components/ui/GlassCard";
import { ProgressBar } from "@/components/admin/ProgressBar";

export function StatCard({
  label,
  value,
  caption,
  progress,
  progressColor,
}: {
  label: string;
  value: string;
  caption: string;
  /** 0-100 — renders a small progress bar under the caption. Omit for none. */
  progress?: number;
  progressColor?: string;
}) {
  return (
    <GlassCard className="p-5">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-3">{label}</p>
      <p className="font-display text-kov-bone text-3xl mb-2">{value}</p>
      <p className="text-kov-steel text-xs">{caption}</p>
      {progress !== undefined && <ProgressBar percent={progress} color={progressColor} className="mt-3" />}
    </GlassCard>
  );
}
