// Placeholder gallery — real project imagery pending. Sizes are intentionally
// varied per docs/KOV-IMMERSIVE-SCENES.md ("never a uniform 3x2 card grid").
const PROJECTS = [
  { id: "01", name: "Kanti", tag: "Wealth Management", span: "md:col-span-2 md:row-span-2" },
  { id: "02", name: "Project 02", tag: "Placeholder", span: "md:col-span-2" },
  { id: "03", name: "Project 03", tag: "Placeholder", span: "md:row-span-2" },
  { id: "04", name: "Project 04", tag: "Placeholder", span: "" },
];

export function WorkGallery() {
  return (
    <section id="work-gallery" className="px-6 py-32 max-w-[1600px] mx-auto">
      <p className="text-xs uppercase tracking-widest text-kov-steel mb-4">Selected work</p>
      <h2
        className="font-display text-kov-bone uppercase max-w-3xl mb-16"
        style={{ fontSize: "var(--heading-lg)", lineHeight: "var(--line-height-display)" }}
      >
        Work<span className="text-kov-red">.</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6">
        {PROJECTS.map((project) => (
          <div
            key={project.id}
            className={`border flex flex-col justify-end p-6 min-h-[240px] ${project.span}`}
            style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
          >
            <p className="text-kov-steel font-mono text-xs mb-2">{project.id} — placeholder visual</p>
            <p className="font-display text-kov-bone uppercase text-lg">{project.name}</p>
            <p className="text-kov-steel text-xs uppercase tracking-widest">{project.tag}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
