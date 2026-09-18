import type { ReactNode } from "react";

interface SectionHeadingProps {
  /** The small uppercase label above the title. */
  eyebrow: string;
  /** ReactNode, not string — every KOV section title carries a red terminal
   * period and most carry a hard <br/>. */
  title: ReactNode;
  /** Optional paragraph under the title. */
  lede?: ReactNode;
  align?: "left" | "center";
  /** `xl` is reserved for the page's closing statement. */
  size?: "lg" | "xl";
  className?: string;
}

const TITLE_SIZE = {
  lg: "clamp(34px, 5vw, 76px)",
  xl: "clamp(40px, 7vw, 116px)",
} as const;

// The eyebrow + display-h2 pairing that every KOV section opens with, finally
// extracted — but only for the four sections rebuilt in this pass.
//
// It is not a sitewide refactor and should not become one. The same class
// string appears dozens of times across the codebase, but the large majority
// of those are field labels in /admin and /client, where this component would
// be semantically wrong. Existing marketing call sites can migrate when
// they're next touched; nothing is gained by moving them all today.
//
// Two deliberate omissions:
//   - No motion. Callers wrap this in <Reveal>. Bundling Reveal here would
//     force a client boundary on every future consumer, including the three
//     Server Components using it right now.
//   - No ScrollFloat. It renders its own <h2>, pulls GSAP, and splits the
//     title into per-character spans; wrapping it here would put ~118 KB of
//     GSAP behind every section header on the site.
//
// <h2> is hardcoded with no `as` escape hatch: these are all section-level,
// and the page has exactly one <h1> (HeroScene) that must stay that way.
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  size = "lg",
  className = "",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={`${centered ? "text-center" : ""} ${className}`}>
      <p
        className={`flex items-center gap-2.5 text-xs uppercase tracking-widest text-kov-steel ${
          centered ? "justify-center" : ""
        }`}
      >
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--kov-red)" }} />
        {eyebrow}
      </p>

      <h2
        className={`mt-6 font-display text-kov-bone uppercase ${centered ? "mx-auto" : ""}`}
        style={{
          fontSize: TITLE_SIZE[size],
          lineHeight: "var(--line-height-display)",
          letterSpacing: "-0.01em",
          maxWidth: size === "xl" ? "14ch" : "16ch",
        }}
      >
        {title}
      </h2>

      {/* concrete, not steel. --kov-steel is 4.41:1 on #0a0a0a — under the
          4.5:1 AA floor for text this size, before the animated background
          lifts it further. Steel stays for the short uppercase eyebrow above,
          where it is a hierarchy signal on two or three words. */}
      {lede && (
        <p
          className={`mt-7 text-kov-concrete text-sm leading-relaxed ${centered ? "mx-auto" : ""}`}
          style={{ maxWidth: "54ch" }}
        >
          {lede}
        </p>
      )}
    </div>
  );
}
