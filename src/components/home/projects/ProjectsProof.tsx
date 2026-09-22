import Link from "next/link";
import { NARRATIVE_ROWS, type Project } from "@/data/projects";
import { Reveal } from "@/components/ui/Reveal";

// Turns the grid above from a portfolio into an argument: for the projects
// that have a real story, what the problem was, what was built, and what
// changed.
//
// It lives under the grid rather than on the cards, and that is a measurement
// rather than a preference. At max-w-[1600px] the 66fr track is ~950px, so a
// card in lg:grid-cols-3 is ~300px wide and its image area ~276×189. Three
// labelled rows are ~155px — 82% of the image, permanently. Reveal-on-hover
// was rejected for a harder reason: Kanti has `href: null`, so its card is not
// a <Link> and never receives focus. The one project with a story would have
// been the one story unreachable by keyboard or screen reader.
//
// Degradation is by construction, not by styling: entries without a narrative
// are simply not in the list. No empty slot, no "bientôt", no greyed row. As
// real work lands, the band grows on its own.
export function ProjectsProof({ projects }: { projects: Project[] }) {
  const told = projects.filter((project) => project.narrative);
  if (told.length === 0) return null;

  // A two-column grid holding one item reads as a mistake rather than a
  // choice, so a single story takes the full width instead.
  const columns = told.length > 1 ? "lg:grid-cols-2" : "";

  return (
    <Reveal variant="fade">
      <div className="mt-20 pt-14 border-t" style={{ borderColor: "var(--kov-border)" }}>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--kov-red)" }} />
          <p className="font-mono text-kov-concrete" style={{ fontSize: 11, letterSpacing: "0.22em" }}>
            LA MÉTHODE, SUR UN CAS RÉEL
          </p>
        </div>

        <div className={`mt-10 grid grid-cols-1 gap-12 lg:gap-16 ${columns}`}>
          {told.map((project) => (
            <div key={project.id}>
              <h3 className="font-display text-kov-bone uppercase" style={{ fontSize: 19, letterSpacing: "-0.01em" }}>
                {project.name}
              </h3>
              <p className="text-kov-concrete text-[11px] uppercase tracking-widest mt-1.5">{project.category}</p>

              {/* <dl> is the correct element for label→value pairs and is
                  well supported by assistive tech. Always-visible real HTML
                  text: no hover, no disclosure — which is simultaneously the
                  most accessible option and the best one for crawlers. */}
              <dl className="mt-7">
                {NARRATIVE_ROWS.map((row, index) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-1 md:grid-cols-[88px_1fr] gap-1.5 md:gap-5 py-4"
                    style={index > 0 ? { borderTop: "1px solid var(--kov-border)" } : undefined}
                  >
                    <dt
                      className="font-mono text-kov-red uppercase"
                      style={{ fontSize: 10, letterSpacing: "0.18em", paddingTop: 2 }}
                    >
                      {row.label}
                    </dt>
                    <dd className="text-kov-concrete text-sm leading-relaxed" style={{ maxWidth: "58ch" }}>
                      {project.narrative![row.key]}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Nothing has a case study yet — caseStudyHref is null on every
                  entry — so this renders for no one today. It exists so the
                  field stops being dead the day a journal post lands, without
                  anyone having to remember to wire it. */}
              {project.caseStudyHref && (
                <Link
                  href={project.caseStudyHref}
                  className="inline-flex items-center gap-2 mt-5 text-kov-bone text-xs uppercase tracking-widest hover:text-kov-red transition-colors"
                >
                  Lire l&apos;étude de cas
                  <span aria-hidden="true">→</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
