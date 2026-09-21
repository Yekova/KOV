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
  if (present.length === 0) return null;

  return (
    <section className="ps-narrative" aria-label="Le projet">
      {present.map((column) => (
        <div key={column.key}>
          <p className="ps-label">{column.label}</p>
          <p className="ps-narrative__text">{data[column.key]}</p>
        </div>
      ))}
    </section>
  );
}
