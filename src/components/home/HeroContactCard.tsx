import Link from "next/link";
import Image from "next/image";
import ShapeBlur from "@/components/ui/ShapeBlur";

// A glass box (character + CTA) whose border resolves into a red glow that
// follows the cursor along the outline — see ShapeBlur.tsx. Hidden below
// `lg`: at hero-headline sizes there isn't reliably enough clear space next
// to the CTA row on narrower viewports for a box this size without risking
// overlap, and the hover effect itself is meaningless on touch anyway.
export function HeroContactCard() {
  return (
    <div
      className="hidden lg:block relative overflow-hidden border p-5 max-w-xs"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        borderColor: "var(--glass-border)",
        borderRadius: "var(--radius-glass)",
        boxShadow: "var(--glass-shadow-full)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <ShapeBlur
          variation={0}
          shapeSize={0.62}
          roundness={0.35}
          borderSize={0.06}
          circleSize={0.5}
          circleEdge={1}
          color="#E31E24"
        />
      </div>

      <div className="relative flex items-end gap-4">
        <Image
          src="/kov/character/assistant-portrait-transparent.png"
          alt=""
          aria-hidden="true"
          width={621}
          height={1007}
          className="h-24 w-auto shrink-0"
        />
        <div>
          <p className="font-display text-kov-bone uppercase text-sm">Un projet en tête ?</p>
          <p className="text-kov-steel text-xs mt-1 leading-relaxed">On en discute, sans engagement.</p>
          <div className="mt-3 flex flex-col items-start gap-1.5">
            <Link
              href="/contact"
              className="text-kov-red text-xs uppercase tracking-widest hover:text-kov-red-signal transition-colors"
            >
              Contacter KOV →
            </Link>
            <Link
              href="/#work-gallery"
              className="text-kov-steel text-xs uppercase tracking-widest hover:text-kov-bone transition-colors"
            >
              Voir les projets →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
