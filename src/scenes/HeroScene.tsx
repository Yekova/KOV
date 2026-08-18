import { GlassSphere } from "@/components/ui/GlassSphere";

export function HeroScene() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-between px-6 py-24 md:py-32 max-w-[1600px] mx-auto relative overflow-hidden"
    >
      <GlassSphere size={280} className="absolute top-1/3 right-10 hidden md:block" />
      <GlassSphere size={90} className="absolute bottom-40 right-1/3 hidden lg:block" />
      <p className="font-display text-kov-bone text-lg tracking-widest">KOV</p>

      <h1
        className="font-display text-kov-bone uppercase"
        style={{ fontSize: "var(--display-xl)", lineHeight: "var(--line-height-display)" }}
      >
        WE BUILD
        <br />
        WHAT PEOPLE
        <br />
        REMEMBER<span className="text-kov-red">.</span>
      </h1>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-xs uppercase tracking-widest text-kov-steel">
        <p>Design / Development / Motion</p>
        <p className="animate-pulse">Scroll to enter</p>
      </div>
    </section>
  );
}
