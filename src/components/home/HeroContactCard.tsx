import Link from "next/link";
import Image from "next/image";

// A softer, more sculpted take on KOV's usual flat glass recipe — an extra
// light/dark shadow pair (neumorphic emboss) layered on top of the existing
// blur/tint, alongside the character already used elsewhere (client
// dashboard, footer). Hidden below `lg`: at hero-headline sizes there isn't
// reliably enough clear space next to the CTA row on narrower viewports for
// a card this size without risking overlap.
const NEUMORPHIC_GLASS_STYLE = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
  borderColor: "var(--glass-border)",
  boxShadow:
    "inset 0 1px 0 var(--glass-highlight), " +
    "-14px -14px 32px rgba(255, 255, 255, 0.05), " +
    "20px 20px 44px rgba(0, 0, 0, 0.6)",
} as const;

export function HeroContactCard() {
  return (
    <div
      className="hidden lg:flex items-end gap-4 border p-5 max-w-xs"
      style={{ ...NEUMORPHIC_GLASS_STYLE, borderRadius: "var(--radius-glass)" }}
    >
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
  );
}
