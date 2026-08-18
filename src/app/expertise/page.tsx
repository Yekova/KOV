import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Expertise — KOV",
  description: "Design, development, and motion, built as one system, not three departments.",
};

const PILLARS = [
  {
    number: "01",
    title: "Design",
    body: "Interfaces engineered like architecture. Structure first, style earned — never applied on top to hide a weak layout.",
  },
  {
    number: "02",
    title: "Development",
    body: "Production-grade code from day one. Fast, precise, and built to survive contact with real users and real traffic.",
  },
  {
    number: "03",
    title: "Motion",
    body: "Movement that explains, never performs. Every transition exists to communicate something — or it doesn't exist.",
  },
];

export default function ExpertisePage() {
  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Expertise</p>

      <h1
        className="font-display text-kov-bone uppercase max-w-4xl"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        We don&apos;t decorate<span className="text-kov-red">.</span>
        <br />
        We build systems that hold<span className="text-kov-red">.</span>
      </h1>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t" style={{ borderColor: "var(--kov-border)" }}>
        {PILLARS.map((pillar) => (
          <div key={pillar.number} className="pt-10">
            <p className="text-kov-red font-mono text-xs mb-4">{pillar.number}</p>
            <h2 className="font-display text-kov-bone uppercase text-2xl mb-4">{pillar.title}</h2>
            <p className="text-kov-concrete text-sm leading-relaxed">{pillar.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-32">
        <Link
          href="/contact"
          className="inline-block text-xs uppercase tracking-widest text-kov-bone border px-6 py-4 hover:text-kov-red hover:border-kov-red transition-colors"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
        >
          Start a project →
        </Link>
      </div>
    </main>
  );
}
