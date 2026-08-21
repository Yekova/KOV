const TODAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };

export function DashboardHeader({ fullName }: { fullName: string | null }) {
  const today = new Date().toLocaleDateString("fr-FR", TODAY_FORMAT);

  return (
    <div
      className="relative overflow-hidden p-8 md:p-10 border"
      style={{ borderColor: "var(--glass-border)", borderRadius: "var(--radius-md)", background: "var(--kov-black)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kov/character/login-frames/frame-030.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ objectPosition: "75% 50%" }}
      />
      {/* Left-to-right fade keeps the greeting readable over the character's
          bright rim light without flattening the image to near-nothing. */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, var(--kov-black) 28%, rgba(10,10,10,0.55) 60%, rgba(10,10,10,0.15) 100%)" }}
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
    </div>
  );
}
