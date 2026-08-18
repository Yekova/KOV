// Placeholder spotlight (no case-study pages built yet) — reuses the Kanti
// example from docs/KOV-BRAND.md's portfolio guidance.
export function WorkSpotlight() {
  return (
    <section className="px-6 py-32 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div
          className="md:col-span-2 border min-h-[360px] flex items-end p-8"
          style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-md)" }}
        >
          <p className="text-kov-steel font-mono text-xs uppercase tracking-widest">
            Placeholder visual — case study pending
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-kov-red font-mono text-xs mb-2">Project / 01</p>
          <h3 className="font-display text-kov-bone uppercase text-3xl mb-3">Kanti</h3>
          <p className="text-kov-steel text-xs uppercase tracking-widest mb-6">Wealth Management</p>
          <p className="text-kov-concrete text-xs uppercase tracking-widest mb-8">
            Strategy · Design · Development
          </p>
          <span className="text-kov-steel text-xs uppercase tracking-widest">View case study → (soon)</span>
        </div>
      </div>
    </section>
  );
}
