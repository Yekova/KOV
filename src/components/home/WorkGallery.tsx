import { ProjectsEditorial } from "@/components/home/projects/ProjectsEditorial";
import { ProjectsGrid } from "@/components/home/projects/ProjectsGrid";
import { ProjectsProof } from "@/components/home/projects/ProjectsProof";
import { ScrollScene } from "@/components/ui/ScrollScene";
import { fetchShowcaseProjects } from "@/lib/showcase/projects";

// The projects section: an editorial column beside an aligned grid of six
// cards. The background stays the page's own; the only thing added here is
// a very faint rule grid, which the cards now sit squarely on.
// The one place on the homepage that knows where project data comes from.
// Everything below it receives a list — which is what lets two of the three
// children stay Client Components.
export async function WorkGallery() {
  const projects = await fetchShowcaseProjects();
  // The homepage grid is three columns by two and wants six; /projets lists
  // everything. That is the whole of what `showOnHome` decides.
  const shown = projects.filter((project) => project.showOnHome);

  return (
    <section id="work-gallery" className="relative px-6 py-20 md:py-32 max-w-[1600px] mx-auto scroll-mt-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(231,231,229,0.028) 1px, transparent 1px), linear-gradient(to bottom, rgba(231,231,229,0.028) 1px, transparent 1px)",
          backgroundSize: "78px 78px",
          maskImage: "radial-gradient(70% 60% at 50% 50%, #000 30%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 50%, #000 30%, transparent 78%)",
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,34fr)_minmax(0,66fr)] gap-14 lg:gap-16">
        {/* Not wrapped, and that is deliberate: this column is lg:sticky, and
            a transform on it or on any ancestor turns it into the scroll
            container sticky resolves against, which silently un-sticks it.
            The grid beside it has no such constraint. */}
        <ProjectsEditorial />
        <ScrollScene stagger selector="[data-scroll-item]" spacing="tight">
          <ProjectsGrid projects={shown} />
        </ScrollScene>
      </div>

      {/* The grid shows what exists; this says what it took. Full width under
          both columns, and it renders only the projects that actually have a
          story — today two of six. */}
      <ScrollScene className="relative" parallax={26}>
        <ProjectsProof projects={shown} />
      </ScrollScene>
    </section>
  );
}
