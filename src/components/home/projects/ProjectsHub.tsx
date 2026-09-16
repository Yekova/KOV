"use client";

interface ProjectsHubProps {
  lit: boolean;
  onHover: (lit: boolean) => void;
}

// The point every connection resolves to. Small on purpose: it is the
// section's thesis, not its hero — the argument is that the projects are
// connected, and a hub that outweighed them would say the opposite.
export function ProjectsHub({ lit, onHover }: ProjectsHubProps) {
  return (
    <div
      data-hub="true"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="flex items-center gap-4 px-6 py-4 transition-[border-color,box-shadow] duration-300"
      style={{
        borderRadius: 18,
        background: "rgba(14,14,16,0.82)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${lit ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)"}`,
        boxShadow: lit ? "0 0 40px rgba(227,30,36,0.14)" : "none",
      }}
    >
      <p className="font-display uppercase" style={{ fontSize: 22, letterSpacing: "0.18em", color: "var(--kov-bone)" }}>
        KOV
      </p>
      <span aria-hidden="true" className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.14)" }} />
      <p
        style={{
          fontSize: 10,
          lineHeight: 1.5,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(231,231,229,0.5)",
        }}
      >
        Des projets
        <br />
        qui font sens
      </p>
    </div>
  );
}
