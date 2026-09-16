"use client";

import Image from "next/image";

interface ProjectsHubProps {
  lit: boolean;
  onHover: (lit: boolean) => void;
}

// The point every connection resolves to — now the mark and nothing else.
// The wordmark already says what the two lines of copy underneath it were
// saying, and a caption at the centre of a diagram competes with the very
// lines it is meant to anchor.
//
// Small on purpose: this is the section's thesis, not its hero. A hub that
// outweighed the projects would argue the opposite of what the layout
// claims.
export function ProjectsHub({ lit, onHover }: ProjectsHubProps) {
  return (
    <div className="relative">
      {/* The lines converge into light rather than into an edge. Sits behind
          the plate and never takes pointer events. */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none transition-opacity duration-500"
        style={{
          inset: -46,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(227,30,36,0.16), transparent 68%)",
          opacity: lit ? 1 : 0.45,
        }}
      />

      <div
        data-hub="true"
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        className="relative flex items-center justify-center transition-[border-color,box-shadow,transform] duration-300"
        style={{
          padding: "16px 26px",
          borderRadius: 16,
          background: "rgba(13,13,15,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${lit ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.11)"}`,
          boxShadow: lit
            ? "0 0 34px rgba(227,30,36,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "0 18px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          transform: lit ? "scale(1.03)" : "scale(1)",
        }}
      >
        <Image
          src="/kov/brand/kov-wordmark-bone.png"
          alt="KOV"
          width={118}
          height={22}
          className="transition-opacity duration-300"
          style={{ width: 118, height: "auto", opacity: lit ? 1 : 0.88 }}
        />
      </div>
    </div>
  );
}
