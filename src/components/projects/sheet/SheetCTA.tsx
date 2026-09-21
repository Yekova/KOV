import Link from "next/link";
import type { ProjectSheetData } from "./sheetData";

// Two actions at most, and each one only where the route it points at
// actually exists. A project with neither shows neither, rather than a
// disabled button or a case study nobody has written.
export function SheetCTA({ data }: { data: ProjectSheetData }) {
  if (!data.websiteUrl && !data.caseStudyUrl) return null;

  return (
    <section className="ps-cta">
      {data.websiteUrl && (
        <Link href={data.websiteUrl} className="ps-cta__btn ps-cta__btn--primary">
          Voir le site
          <span aria-hidden="true">→</span>
        </Link>
      )}
      {data.caseStudyUrl && (
        <Link href={data.caseStudyUrl} className="ps-cta__btn">
          Étude de cas
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </section>
  );
}
