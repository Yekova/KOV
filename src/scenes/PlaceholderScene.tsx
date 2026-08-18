interface PlaceholderSceneProps {
  id: string;
  label: string;
}

// Stand-in for a real scene (ExpertiseScene, WorkScene, etc.) until content/copy lands.
// Keeps the scroll map in src/data/scenes.ts wired to something visible in the meantime.
export function PlaceholderScene({ id, label }: PlaceholderSceneProps) {
  return (
    <section id={id} className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        <p className="text-xs uppercase tracking-widest text-kov-steel">
          Placeholder — real content pending
        </p>
        <h2
          className="font-display text-kov-bone uppercase"
          style={{ fontSize: "var(--display-lg)", lineHeight: "var(--line-height-display)" }}
        >
          {label}
        </h2>
      </div>
    </section>
  );
}
