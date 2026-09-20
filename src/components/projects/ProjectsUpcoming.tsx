import { PROJECTS } from "@/data/projects";

// What is booked but not published.
//
// Three reserved cards with "Bientôt" written in them is what a thin
// portfolio looks like. An index of rows is what a full one looks like — the
// same honest information, carrying no pretence of being work you can look
// at. Nothing here has a name, an image or a link, because none of those
// exist yet, and the row says so rather than implying otherwise.
//
// The band disappears on its own the day every entry in projects.ts is live.
export function ProjectsUpcoming() {
  const upcoming = PROJECTS.filter((project) => project.status === "upcoming");
  if (upcoming.length === 0) return null;

  return (
    <section className="kov-soon" aria-labelledby="projets-a-venir">
      <div className="kov-soon__head">
        <h2 id="projets-a-venir" className="kov-soon__title">
          À venir
        </h2>
        {/* Says only what the data actually knows: these are not published.
            Not "livrés", not "en production" — neither is recorded anywhere,
            and a portfolio is the last place to start guessing. */}
        <p className="kov-soon__note">
          Des projets qui ne sont pas encore en ligne. Ils rejoindront cette page quand ils le seront.
        </p>
      </div>

      <ol className="kov-soon__list">
        {upcoming.map((project) => (
          <li key={project.id} className="kov-soon__row">
            <span aria-hidden="true" className="kov-soon__index">
              {project.id}
            </span>
            <span className="kov-soon__tags">
              {project.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </span>
            <span className="kov-soon__state">Non publié</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
