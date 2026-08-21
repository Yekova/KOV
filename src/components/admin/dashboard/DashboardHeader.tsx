import { GlassCard } from "@/components/ui/GlassCard";

const TODAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

export function DashboardHeader({ fullName }: { fullName: string | null }) {
  const today = new Date().toLocaleDateString("fr-FR", TODAY_FORMAT);

  return (
    <GlassCard className="relative overflow-hidden p-8 md:p-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kov/brand/kov-monogram-k-transparent.png"
        alt=""
        aria-hidden="true"
        className="absolute -right-6 -bottom-10 w-40 md:w-56 pointer-events-none select-none"
        style={{ opacity: 0.06 }}
      />
      <div className="relative">
        <p className="text-kov-red text-xs uppercase tracking-widest mb-2">
          Bonjour{fullName ? ` ${fullName.split(" ")[0]}` : ""}
        </p>
        <h1 className="font-display text-kov-bone uppercase" style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}>
          Vue d&apos;ensemble
        </h1>
        <p className="text-kov-steel text-sm mt-2 capitalize">{today}</p>
      </div>
    </GlassCard>
  );
}
