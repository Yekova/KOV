"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

// The left column. Deliberately no statistics block: the brief's own rule
// was that figures which aren't real must not be shown as if they were, and
// the project data holds two delivered pieces of work, not fifty. The slot
// is left for the day those numbers exist rather than filled with invented
// ones.
export function ProjectsEditorial() {
  return (
    <div className="lg:sticky lg:top-28">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--kov-red)" }} />
        <p className="font-mono text-kov-steel" style={{ fontSize: 11, letterSpacing: "0.22em" }}>
          NOS PROJETS
        </p>
      </div>

      <h2
        className="font-display uppercase text-kov-bone"
        style={{
          marginTop: 26,
          fontSize: "clamp(38px, 4.6vw, 74px)",
          lineHeight: 0.95,
          letterSpacing: "-0.01em",
        }}
      >
        Des projets
        <br />
        qui prennent
        <br />
        vie<span style={{ color: "var(--kov-red)" }}>.</span>
      </h2>

      <div aria-hidden="true" className="mt-8 h-px w-14" style={{ background: "rgba(255,255,255,0.22)" }} />

      <p className="mt-7 text-kov-steel" style={{ fontSize: 15, lineHeight: 1.65, maxWidth: "38ch" }}>
        Nous combinons stratégie, design et technologie pour concevoir des projets digitaux sur mesure, pensés pour
        avoir un impact durable.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <Button variant="primary" href="/contact">
          Démarrer un projet →
        </Button>
        <Button variant="secondary" href="/studio">
          Visiter le studio ↗
        </Button>
      </div>

      {/* A text link rather than a third button: the grid beside this column
          is the teaser, /projets is where the reasoning behind each project
          is actually written out. Three buttons of equal weight would make
          the reader choose between them instead. */}
      <Link
        href="/projets"
        className="inline-flex items-center gap-2 mt-7 text-kov-bone text-xs uppercase tracking-widest hover:text-kov-red transition-colors"
      >
        Toutes les réalisations
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
