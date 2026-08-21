import { GlassCard } from "@/components/ui/GlassCard";

const TODAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

export function DashboardHeader({ fullName }: { fullName: string | null }) {
  const today = new Date().toLocaleDateString("fr-FR", TODAY_FORMAT);

  return (
    <GlassCard className="p-8 md:p-10">
      <p className="text-kov-red text-xs uppercase tracking-widest mb-2">
        Bonjour{fullName ? ` ${fullName.split(" ")[0]}` : ""}
      </p>
      <h1 className="font-display text-kov-bone uppercase" style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}>
        Vue d&apos;ensemble
      </h1>
      <p className="text-kov-steel text-sm mt-2 capitalize">{today}</p>
    </GlassCard>
  );
}
