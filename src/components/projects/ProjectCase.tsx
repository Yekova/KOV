import Image from "next/image";
import Link from "next/link";
import { NARRATIVE_ROWS, type Project } from "@/data/projects";

// One delivered project, at full page width.
//
// Not a bigger card. The homepage already has the cards, and a page that
// repeated them larger would add size without adding anything to read. What
// this adds is the reasoning: the problem, the system built for it, and what
// changed — the same three rows the homepage band uses, given the room to
// actually be read.
//
// Everything is real HTML from the first byte: no disclosure, no hover, no
// carousel. This is the page a prospect sends to someone else, and the page
// a crawler has to be able to read in one pass.
export function ProjectCase({ project, index }: { project: Project; index: number }) {
  // Alternating sides. The plate leads on the first, the text leads on the
  // second — so two entries read as a rhythm rather than as a repeated row.
  const flipped = index % 2 === 1;

  const plate = (
    <div className={`kov-case__plate${flipped ? " kov-case__plate--flip" : ""}`}>
      <div className="kov-case__frame">
        {project.image ? (
          <Image
            src={project.image}
            alt={`${project.name} — ${project.category}`}
            fill
            sizes="(max-width: 1023px) 92vw, 48vw"
            className="kov-case__img"
          />
        ) : (
          // A delivered project with no photograph yet gets a reserved panel,
          // never a stand-in image. Same rule as the homepage cards.
          <div className="kov-case__reserved">
            <span>Visuel à venir</span>
          </div>
        )}

        {project.tagline && <span className="kov-case__tagline">{project.tagline}</span>}
      </div>
    </div>
  );

  // A fragment, not an <li>. The list item is Reveal's own element on the
  // page — <ol> admits nothing but <li>, so wrapping this in a Reveal <div>
  // would be invalid, and rendering an <li> inside Reveal's <li> would nest
  // two of them and apply the case grid twice.
  return (
    <>
      {plate}

      <div className={`kov-case__body${flipped ? " kov-case__body--flip" : ""}`}>
        <p className="kov-case__meta">
          <span aria-hidden="true" className="kov-case__index">
            {project.id}
          </span>
          <span aria-hidden="true" className="kov-case__rule" />
          {project.category}
        </p>

        <h2 className="kov-case__name">{project.name}</h2>

        <ul className="kov-case__tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        {project.narrative && (
          // <dl> is the element for label→value pairs and assistive tech
          // handles it well. Always visible, always in the markup.
          <dl className="kov-case__story">
            {NARRATIVE_ROWS.map((row) => (
              <div key={row.key} className="kov-case__row">
                <dt>{row.label}</dt>
                <dd>{project.narrative?.[row.key]}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Two links, both conditional, both pointing only at routes that
            exist. Kanti has neither today and therefore shows neither,
            rather than a disabled button or a link to nowhere. */}
        <div className="kov-case__links">
          {project.href && (
            <Link href={project.href} className="kov-case__link kov-case__link--primary">
              Voir le projet
              <span aria-hidden="true">↗</span>
            </Link>
          )}
          {project.caseStudyHref && (
            <Link href={project.caseStudyHref} className="kov-case__link">
              Lire l&apos;étude de cas
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
