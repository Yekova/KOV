import { ExpertiseCompilation } from "./ExpertiseCompilation";

// Section 4 of the homepage. The shell is a Server Component and carries
// nothing but the anchor: `#expertise` is linked from the nav, the footer,
// four activation cards, the 404 page, the journal CTA, the search index and
// siteSections, so the id has to stay exactly this.
//
// scroll-mt-40 (160px) because GradualBlur runs 8rem down the top of every
// page — without it an anchor jump lands the start of the section inside the
// blur. No padding here: each branch of the compilation pads itself, since
// the sequenced one is a sticky viewport and the plain one is a normal block.
export function ExpertiseSection() {
  return (
    <section id="expertise" className="relative scroll-mt-40">
      <ExpertiseCompilation />
    </section>
  );
}
