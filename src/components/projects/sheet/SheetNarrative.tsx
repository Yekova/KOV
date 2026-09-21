import type { ProjectSheetData } from "./sheetData";

const COLUMNS = [
  { key: "context", label: "Le contexte" },
  { key: "response", label: "La réponse" },
  { key: "impact", label: "L'impact" },
] as const;

// Three open columns, no table and no cards. A rule, a label, a sentence,
// and a great deal of air — the brief's whole objection to the previous
// version was that it read as a back-office record of a project rather
// than as an account of one.
export function SheetNarrative({ data }: { data: ProjectSheetData }) {
  const present = COLUMNS.filter((column) => data[column.key]);
  if (present.length === 0 && !data.brief && data.deliverables.length === 0) return null;

  return (
    <section className="ps-narrative" aria-label="Le projet">
      <p className="ps-label">
        Le projet
        <span className="ps-narrative__lead">
          Ce qu&apos;il fallait résoudre, ce qui a été construit, et ce que ça a changé.
        </span>
      </p>

      {/* The room for real context about the client. Null renders nothing
          rather than filler — see `brief` in projects.ts. */}
      {data.brief && <p className="ps-narrative__brief">{data.brief}</p>}

      {present.length > 0 && (
        <div className="ps-narrative__cols">
          {present.map((column) => (
            <div key={column.key}>
              <p className="ps-narrative__head">{column.label}</p>
              <p className="ps-narrative__text">{data[column.key]}</p>
            </div>
          ))}
        </div>
      )}

      {/* Facts about the delivery, filled in by hand. Never derived from
          the response column above, which would be the same words twice. */}
      {data.deliverables.length > 0 && (
        <div className="ps-narrative__deliverables">
          <p className="ps-narrative__head">Livré</p>
          <ul>
            {data.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
