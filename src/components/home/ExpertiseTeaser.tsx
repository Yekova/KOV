import { Button } from "@/components/ui/Button";

const ITEMS = [
  { number: "01", title: "Design", body: "Des interfaces pensées comme de l'architecture." },
  { number: "02", title: "Développement", body: "Du code de production dès le premier jour." },
  { number: "03", title: "Motion", body: "Un mouvement qui explique, jamais qui joue un rôle." },
];

export function ExpertiseTeaser() {
  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Expertise</p>
      <h2
        className="font-display text-kov-bone uppercase max-w-3xl"
        style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
      >
        Six disciplines<span className="text-kov-red">.</span> Un seul système<span className="text-kov-red">.</span>
      </h2>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 border-t pt-10" style={{ borderColor: "var(--kov-border)" }}>
        {ITEMS.map((item) => (
          <div key={item.number}>
            <p className="text-kov-red font-mono text-xs mb-3">{item.number}</p>
            <h3 className="font-display text-kov-bone uppercase text-xl mb-2">{item.title}</h3>
            <p className="text-kov-concrete text-sm leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <Button href="/expertise" variant="secondary" className="mt-16">
        Voir l&apos;expertise →
      </Button>
    </section>
  );
}
