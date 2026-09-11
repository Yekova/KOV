import Link from "next/link";

export function StartProjectContent() {
  return (
    <Link
      href="/contact"
      className="group relative h-full w-full flex items-center justify-between gap-4 px-6"
      style={{ borderRadius: 20 }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "radial-gradient(circle at 15% 50%, rgba(227,30,36,0.16), transparent 70%)", borderRadius: 20 }}
      />
      <div className="relative">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest">Une idée ?</p>
        <p className="font-display text-kov-bone uppercase mt-1" style={{ fontSize: "clamp(15px, 1.6vw, 19px)" }}>
          Faisons-la <span className="text-kov-red">exister.</span>
        </p>
      </div>
      <span
        aria-hidden="true"
        className="relative shrink-0 inline-flex items-center gap-2 text-kov-bone text-xs uppercase tracking-widest group-hover:text-kov-red transition-colors"
      >
        Démarrer un projet
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </span>
    </Link>
  );
}
