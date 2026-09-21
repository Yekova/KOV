import Image from "next/image";
import type { ProjectSheetData } from "./sheetData";

// The first thing, and the loudest. Sixty per cent picture, forty per cent
// words, and the words are a name and one sentence — the brief's ratio is
// seventy visual to thirty informational, and this is where that budget is
// spent.
export function SheetHero({ data, titleId }: { data: ProjectSheetData; titleId: string }) {
  return (
    <section className="ps-hero">
      <div className="ps-hero__frame">
        {data.heroImage ? (
          <Image
            src={data.heroImage}
            alt={`${data.title} — ${data.sector}`}
            fill
            priority
            sizes="(max-width: 1023px) 92vw, 58vw"
            className="ps-hero__img"
          />
        ) : (
          <span className="ps-hero__reserved">Visuel à venir</span>
        )}
      </div>

      <div className="ps-hero__text">
        <p className="ps-hero__index">
          <span aria-hidden="true">{data.id}</span>
          <span aria-hidden="true" className="ps-slash">
            /
          </span>
          Projet
        </p>

        <h2 id={titleId} className="ps-hero__title">
          {data.title}
        </h2>

        <p className="ps-hero__sector">{data.sector}</p>

        {data.description && <p className="ps-hero__line">{data.description}</p>}

        <ul className="ps-hero__tags">
          {data.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
