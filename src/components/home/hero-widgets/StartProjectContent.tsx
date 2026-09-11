import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SIDE_WORDS = ["Discuter", "Imaginer", "Construire"];

export function StartProjectContent() {
  return (
    <Link href="/contact" className="group relative h-full w-full flex items-center justify-between gap-4 px-6 overflow-hidden" style={{ borderRadius: 20 }}>
      {/* Subtle abstract shape — shifts a few px on hover instead of the
          card ever filling with solid red (spec §22). */}
      <div
        aria-hidden="true"
        className="absolute -left-10 -top-10 w-56 h-56 rounded-full pointer-events-none transition-transform duration-500 group-hover:translate-x-3 group-hover:translate-y-2"
        style={{ background: "radial-gradient(circle, rgba(227,30,36,0.14), transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full pointer-events-none transition-transform duration-500 group-hover:-translate-x-2 group-hover:-translate-y-2"
        style={{ background: "radial-gradient(circle, rgba(0,0,0,0.5), transparent 70%)" }}
      />

      <div className="relative">
        <p className="text-kov-steel text-[10px] uppercase tracking-widest">Une idée ?</p>
        <p className="font-display text-kov-bone uppercase mt-1" style={{ fontSize: "clamp(16px, 1.8vw, 22px)", lineHeight: 1.15 }}>
          Faisons-la
          <br />
          <span
            className="transition-[text-shadow] duration-300 group-hover:[text-shadow:0_0_18px_rgba(227,30,36,0.5)]"
            style={{ color: "var(--kov-red)" }}
          >
            Exister.
          </span>
        </p>

        <span className="mt-4 inline-flex items-center gap-2 text-kov-bone text-[11px] uppercase tracking-widest">
          <span
            aria-hidden="true"
            className="inline-flex w-7 h-7 items-center justify-center rounded-full transition-transform group-hover:translate-x-1"
            style={{ border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <ArrowRight size={13} className="group-hover:text-kov-red transition-colors" />
          </span>
          Démarrer un projet
        </span>
      </div>

      {/* Very discreet vertical word stack — spec §21 asks for it to
          barely register. */}
      <div
        aria-hidden="true"
        className="relative hidden lg:flex flex-col items-center gap-3 text-kov-steel text-[9px] uppercase tracking-[0.2em] opacity-30"
        style={{ writingMode: "vertical-rl" }}
      >
        {SIDE_WORDS.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>
    </Link>
  );
}
