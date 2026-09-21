import type { ProjectSheetData } from "./sheetData";

// Large figures, small captions, hairlines between. No boxes.
//
// Renders only where measured, attributable figures exist — which is
// nowhere today, so today it renders for nobody. That is the point: a
// figure on a portfolio is a claim about somebody else's business, and
// there is no such thing as a plausible one.
//
// The brief offers a fallback of "verifiable facts" when the figures are
// missing. The only ones recorded here are the deliverables and the
// disciplines, and both are already on the page — in the narrative column
// and beside the hero. Printing them a third time is the redundancy the
// same brief rejects, so the band simply stands down instead.
export function SheetStats({ data }: { data: ProjectSheetData }) {
  if (data.stats.length === 0) return null;

  return (
    <section className="ps-stats" aria-label="Résultats mesurés">
      {data.stats.map((stat) => (
        <div key={stat.label}>
          <p className="ps-stats__value">{stat.value}</p>
          <p className="ps-stats__label">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}
