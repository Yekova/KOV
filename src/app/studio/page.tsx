import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Studio — KOV",
  description: "KOV is a studio built around one idea: transform ideas into digital experiences people remember.",
};

const PRINCIPLES = [
  { word: "Brutal", body: "We say what a project needs, not what's comfortable to hear." },
  { word: "Precise", body: "Every decision — a pixel, a line of copy, a line of code — has a reason." },
  { word: "Immersive", body: "We design experiences, not pages. The difference is what people remember." },
  { word: "Intentional", body: "Nothing ships because it's trendy. It ships because it earns its place." },
];

const PHILOSOPHY_WORDS = ["Clarté", "Intention", "Impact"];

export default function StudioPage() {
  return (
    <main className="min-h-screen px-6 pt-40 pb-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Studio</p>

      <h1
        className="font-display text-kov-bone uppercase max-w-4xl"
        style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
      >
        KOV transforms ideas
        <br />
        into digital experiences<span className="text-kov-red">.</span>
      </h1>

      <p className="mt-6 text-xs uppercase tracking-widest text-kov-steel">Design / Development / Motion — Bordeaux, France</p>

      <p className="mt-10 max-w-xl text-kov-concrete text-sm leading-relaxed">
        We&apos;re a studio that builds websites and platforms for people who don&apos;t want to
        look like everyone else. No templates, no stock photography, no generic agency-speak.
        Every project starts from what makes it different — not from what&apos;s easy to ship.
      </p>

      <section className="mt-32">
        <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Philosophy</p>
        <h2
          className="font-display text-kov-bone uppercase max-w-3xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Good design doesn&apos;t need to shout<span className="text-kov-red">.</span>
        </h2>
        <div className="mt-10 flex flex-wrap gap-x-10 gap-y-2">
          {PHILOSOPHY_WORDS.map((word) => (
            <span key={word} className="text-kov-concrete text-sm uppercase tracking-widest">
              {word}.
            </span>
          ))}
        </div>
      </section>

      <div
        className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 border-t pt-12"
        style={{ borderColor: "var(--kov-border)" }}
      >
        {PRINCIPLES.map((principle) => (
          <div key={principle.word}>
            <h2 className="font-display text-kov-bone uppercase text-2xl mb-3">{principle.word}</h2>
            <p className="text-kov-concrete text-sm leading-relaxed">{principle.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-32 border-t pt-16" style={{ borderColor: "var(--kov-border)" }}>
        <h2
          className="font-display text-kov-bone uppercase max-w-2xl"
          style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
        >
          Small by design<span className="text-kov-red">.</span>
        </h2>
        <p className="mt-6 max-w-md text-kov-concrete text-sm leading-relaxed">
          Less layers.
          <br />
          More involvement.
          <br />
          Better work.
        </p>
      </section>

      <div className="mt-32">
        <Button href="/contact" variant="primary">
          Start a project →
        </Button>
      </div>
    </main>
  );
}
