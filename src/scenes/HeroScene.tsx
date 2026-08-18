export function HeroScene() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-between px-6 py-24 md:py-32 max-w-[1600px] mx-auto"
    >
      <p className="font-display text-kov-bone text-lg tracking-widest">KOV</p>

      <h1
        className="font-display text-kov-bone uppercase max-w-[68%]"
        style={{ fontSize: "var(--display-xl)", lineHeight: "var(--line-height-display)" }}
      >
        ON CONSTRUIT
        <br />
        CE QU&apos;ON
        <br />
        RETIENT<span className="text-kov-red">.</span>
      </h1>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-xs uppercase tracking-widest text-kov-steel">
        <p>Design / Développement / Motion</p>
        <p className="animate-pulse">Scrollez pour entrer</p>
      </div>
    </section>
  );
}
