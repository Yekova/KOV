import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { TagPill } from "@/components/ui/Chip";

export const metadata: Metadata = {
  title: "Expertise — KOV",
  description: "Strategy, design, development, motion, systems, and integration, built as one system.",
};

const PILLARS = [
  {
    number: "01",
    title: "Strategy",
    body: "Positioning, structure, and user journeys — decided before anything gets designed.",
  },
  {
    number: "02",
    title: "Design",
    body: "Interfaces engineered like architecture. Structure first, style earned — never applied on top to hide a weak layout.",
  },
  {
    number: "03",
    title: "Development",
    body: "Production-grade code from day one. Fast, precise, and built to survive contact with real users and real traffic.",
  },
  {
    number: "04",
    title: "Motion",
    body: "Movement that explains, never performs. Every transition exists to communicate something — or it doesn't exist.",
  },
  {
    number: "05",
    title: "Systems",
    body: "Digital architecture built to scale — not a one-off site that breaks the moment the business grows.",
  },
  {
    number: "06",
    title: "Integration",
    body: "Tools, data, and automations, connected — so the site is the front of something that actually runs.",
  },
];

const PROCESS = [
  { number: "01", title: "Discover", body: "What actually matters here, not a generic brief." },
  { number: "02", title: "Structure", body: "Information architecture and priorities, locked." },
  { number: "03", title: "Design", body: "Direction decided before a single pixel ships." },
  { number: "04", title: "Develop", body: "Built in the open, iterated in real code." },
  { number: "05", title: "Motion", body: "Interaction layered in — never bolted on after." },
  { number: "06", title: "Launch", body: "Shipped, measured, left in a state anyone could maintain." },
  { number: "07", title: "Evolve", body: "A site is never finished — it's maintained on purpose." },
];

const WHAT_WE_BUILD = [
  "Corporate websites",
  "Immersive websites",
  "Web applications",
  "Dashboards",
  "Client portals",
  "Digital systems",
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

      <section className="mt-40">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Process</p>
        <h2
          className="font-display text-kov-bone uppercase mb-16"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Seven steps<span className="text-kov-red">.</span> No black box.
        </h2>

        <ol className="border-t" style={{ borderColor: "var(--kov-border)" }}>
          {PROCESS.map((step) => (
            <li
              key={step.number}
              className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-8 py-6 border-b"
              style={{ borderColor: "var(--kov-border)" }}
            >
              <span className="text-kov-red font-mono text-xs w-10 shrink-0">{step.number}</span>
              <span className="font-display text-kov-bone uppercase text-xl w-full md:w-48 shrink-0">
                {step.title}
              </span>
              <span className="text-kov-concrete text-sm leading-relaxed">{step.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-40">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-6">What we build</p>
        <div className="flex flex-wrap gap-3 max-w-3xl">
          {WHAT_WE_BUILD.map((item) => (
            <TagPill key={item}>{item}</TagPill>
          ))}
        </div>
      </section>

      <div className="mt-32">
        <Button href="/contact" variant="primary">
          Start a project →
        </Button>
      </div>
    </main>
  );
}
