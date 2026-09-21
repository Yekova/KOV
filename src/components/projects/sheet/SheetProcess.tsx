import type { ProjectSheetData } from "./sheetData";

// One fine line, seven points, seven words. The previous version gave this
// a block of its own; it is context, not content, and it now takes the
// height of a caption.
export function SheetProcess({ data }: { data: ProjectSheetData }) {
  if (data.process.length === 0) return null;

  return (
    <section className="ps-process" aria-label="La méthode appliquée">
      <p className="ps-label">
        Processus
        <span className="ps-process__count">
          {data.process.length} étapes · de la stratégie à la mise en ligne
        </span>
      </p>

      <ol className="ps-process__line">
        {data.process.map((step) => (
          <li key={step.number}>
            <span aria-hidden="true" className="ps-process__dot" />
            <span className="ps-process__name">{step.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
