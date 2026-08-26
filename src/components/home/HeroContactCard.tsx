import Link from "next/link";
import Image from "next/image";
import ShapeBlur from "@/components/ui/ShapeBlur";

// A glass box (character + CTA) whose only frame is the ShapeBlur red glow
// that follows the cursor along the outline — no separate static border or
// inset rim highlight underneath it, so the shader is the one and only line
// the box draws. Visibility (`hidden lg:block`) is handled by the caller
// (HeroScene.tsx wraps this in a Reveal with that class) since this
// component's own root is the sized box itself.
export function HeroContactCard() {
  return (
    <div
      className="relative overflow-hidden p-8 w-full max-w-md"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(180%)",
        borderRadius: "var(--radius-glass)",
        boxShadow: "0 24px 70px rgba(0, 0, 0, 0.55)",
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

      <div className="relative flex items-end gap-5">
        <Image
          src="/kov/character/assistant-portrait-transparent.png"
          alt=""
          aria-hidden="true"
          width={621}
          height={1007}
          className="h-36 w-auto shrink-0"
        />
        <div>
          <p className="font-display text-kov-bone uppercase text-lg">Un projet en tête ?</p>
          <p className="text-kov-steel text-sm mt-1.5 leading-relaxed">On en discute, sans engagement.</p>
          <div className="mt-4 flex flex-col items-start gap-2">
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
