"use client";

import Link from "next/link";
import { useRef, type ReactNode, type ButtonHTMLAttributes, type RefObject } from "react";
import { SpecularButtonEffect } from "@/components/ui/SpecularButtonEffect";

type Variant = "primary" | "secondary" | "ghost" | "pill";

const BASE = "relative inline-flex items-center gap-2 text-xs uppercase tracking-widest transition-colors";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "px-6 py-4 bg-kov-red text-kov-white hover:bg-kov-red-signal",
  secondary: "px-6 py-4 border text-kov-bone hover:text-kov-red hover:border-kov-red",
  ghost: "text-kov-bone hover:text-kov-red",
  // group + overflow-hidden: hosts the glass-sheen span below (see
  // GLASS_SHEEN_STYLE) instead of SpecularButtonEffect's tracing shader —
  // the Nav CTA is the one surface on the nav bar itself, and a moving
  // bright line around a small pill read as neon, not liquid. A soft
  // corner highlight fading in over the red hover fill reads as light on
  // glossy glass instead — same family as LiquidBlob's rim highlight.
  pill: "group px-5 py-2.5 border text-kov-bone hover:bg-kov-red hover:text-kov-white hover:border-kov-red hover:shadow-[0_8px_24px_rgba(227,30,36,0.35)] overflow-hidden",
};

const PILL_TRANSITION = {
  transitionProperty: "background-color, border-color, color, box-shadow",
  transitionDuration: "0.3s",
} as const;

// One entry per variant that has a real edge/surface for the specular shine
// to trace. `ghost` has no border or fill — tracing an edge on it would draw
// a border that was never there, so it's deliberately excluded. `pill` uses
// the glass-sheen span instead (see VARIANT_CLASSES.pill).
const SPECULAR_CONFIG: Partial<Record<Variant, { radius: number; lineColor: string; baseColor: string }>> = {
  primary: { radius: 4, lineColor: "#E7E7E5", baseColor: "#8a1216" },
  secondary: { radius: 4, lineColor: "#E31E24", baseColor: "#3a3a3a" },
};

function variantStyle(variant: Variant) {
  if (variant === "ghost") return undefined;
  return {
    borderRadius: variant === "pill" ? "var(--radius-pill)" : "var(--radius-sm)",
    borderColor: variant === "primary" ? "transparent" : "var(--kov-border)",
    ...(variant === "pill" ? PILL_TRANSITION : undefined),
  };
}

interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({ children, variant = "secondary", href, className = "", ...rest }: ButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${className}`;
  const style = variantStyle(variant);
  const specular = SPECULAR_CONFIG[variant];

  const content = (
    <>
      {specular && <SpecularButtonEffect hostRef={ref} {...specular} />}
      {variant === "pill" && (
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: "radial-gradient(circle at 28% 20%, rgba(255,255,255,0.4), transparent 65%)" }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link ref={ref as RefObject<HTMLAnchorElement>} href={href} className={classes} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button ref={ref as RefObject<HTMLButtonElement>} className={`${classes} disabled:opacity-50`} style={style} {...rest}>
      {content}
    </button>
  );
}
