import Link from "next/link";
import { isExternalHref } from "@/data/projects";
import type { ProjectSheetData } from "./sheetData";

// Two actions at most, and each one only where the route it points at
// actually exists. A project with neither shows neither, rather than a
// disabled button or a case study nobody has written.
export function SheetCTA({ data }: { data: ProjectSheetData }) {
  if (!data.websiteUrl && !data.caseStudyUrl) return null;

  return (
    <section className="ps-cta">
      {/* A client's own site opens in its own tab. In here it matters
          twice over: following it in place would close the sheet the
          visitor is reading and take them off the site in one click. */}
      {data.websiteUrl &&
        (isExternalHref(data.websiteUrl) ? (
          <a
            href={data.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ps-cta__btn ps-cta__btn--primary"
          >
            Voir le site
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <Link href={data.websiteUrl} className="ps-cta__btn ps-cta__btn--primary">
            Voir le site
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      {data.caseStudyUrl && (
        <Link href={data.caseStudyUrl} className="ps-cta__btn">
          Étude de cas
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </section>
  );
}
