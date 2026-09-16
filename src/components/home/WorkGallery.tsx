import { ProjectsEditorial } from "@/components/home/projects/ProjectsEditorial";
import { ProjectsNetwork } from "@/components/home/projects/ProjectsNetwork";

// The projects section: an editorial column against a network of six cards
// that all resolve to one centre. The point of the layout is the argument —
// each piece of work is its own thing, and every one of them connects back
// to the same method. A plain grid would say the opposite.
//
// The background stays the page's own; the only thing added here is a very
// faint rule grid, to give the curves something to sit against.
export function WorkGallery() {
  return (
    <section id="work-gallery" className="relative px-6 py-32 max-w-[1600px] mx-auto scroll-mt-24">
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
        <ProjectsEditorial />
        <ProjectsNetwork />
      </div>
    </section>
  );
}
