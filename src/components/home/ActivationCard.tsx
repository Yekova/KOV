import type { ReactNode } from "react";

interface ActivationCardProps {
  number: string;
  title: string;
  body: string;
  /** Only card 4 ("Performance durable") actually passes this — the
   * others show just number/title/body/visual, matching the reference
   * spec (not every card has a checklist). */
  features?: string[];
  visual: ReactNode;
}

// A 9:16 card — number, title, body, one themed visual area (chart, the
// real Responsive video, or a photo), flat glass background (no
// GlassSurface: up to 5–6 of these can be visible at once in the
// coverflow below, and real-time SVG refraction on that many simultaneous
// instances was the smoothness cost cut a few turns ago).
// Purely presentational: no entrance animation, no size measurement of
// its own — ActivationWindow drives every card's scale/blur/opacity/
// position via imperative transforms on its wrapper every scroll frame,
// so nothing here needs to react to that itself.
export function ActivationCard({ number, title, body, features, visual }: ActivationCardProps) {
  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col"
      style={{
        borderRadius: 20,
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      <div className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center">{visual}</div>

      <div className="p-5 shrink-0 text-left">
        <p className="text-kov-red font-mono text-xs mb-2">{number}</p>
        <p className="text-kov-bone text-base uppercase tracking-wide mb-2">{title}</p>
        <p className="text-kov-steel text-xs leading-relaxed">{body}</p>

        {features && features.length > 0 && (
          <ul className="space-y-1.5 mt-4 pt-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-[11px] text-kov-concrete">
                <span aria-hidden="true" className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--kov-red)" }} />
                {feature}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
