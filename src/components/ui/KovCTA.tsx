import Link from "next/link";
import ShapeBlur from "@/components/ui/ShapeBlur";

const GLASS_PILL_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
} as const;

interface KovCTAProps {
  href: string;
  children: string;
  /** Small red marker before the label — the "point rouge" accent. On by default; turn off next to another red accent (a red-dotted heading) so the two don't compete. */
  dot?: boolean;
  haloColor?: string;
  className?: string;
}

// The homepage's premium CTA — extracted from HeroScene's original inline
// version (same halo, same glass pill) so section rebuilds reuse one
// component instead of each hand-rolling the ShapeBlur+group-hover wiring.
// Distinct from the sitewide `Button` component (nav, footer, every other
// page) — Button's SpecularButtonEffect shine is the everyday CTA; this is
// reserved for homepage moments the brief calls out as needing more
// presence (Hero, section-ending CTAs).
//
// ShapeBlur's own canvas tracks the cursor continuously regardless of
// hover state (see ShapeBlur.tsx) — group-hover:opacity gates its
// visibility rather than the effect itself, so the halo reads as a
// discrete hover reveal instead of a faint always-on glow.
export function KovCTA({ href, children, dot = true, haloColor = "#E31E24", className = "" }: KovCTAProps) {
  return (
    <div className={`group relative inline-block ${className}`}>
      <div className="absolute -inset-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ShapeBlur variation={0} shapeSize={1.6} roundness={1.55} borderSize={0.07} circleSize={0.55} circleEdge={1} color={haloColor} />
      </div>
      <Link
        href={href}
        className="relative inline-flex items-center gap-2 px-6 py-3 border text-kov-bone text-xs uppercase tracking-widest group-hover:text-kov-red transition-all duration-300 group-hover:scale-[1.02]"
        style={{ ...GLASS_PILL_STYLE, borderRadius: "var(--radius-pill)" }}
      >
        {dot && <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-kov-red shrink-0" />}
        <span>{children}</span>
        <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}
