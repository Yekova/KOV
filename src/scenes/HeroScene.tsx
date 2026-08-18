export function HeroScene() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-between px-6 py-24 md:py-32 max-w-[1600px] mx-auto"
    >
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
