import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "pill";

const BASE = "inline-flex items-center gap-2 text-xs uppercase tracking-widest transition-colors";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "px-6 py-4 bg-kov-red text-kov-white hover:bg-kov-red-signal",
  secondary: "px-6 py-4 border text-kov-bone hover:text-kov-red hover:border-kov-red",
  ghost: "text-kov-bone hover:text-kov-red",
  pill: "px-5 py-2.5 border text-kov-bone hover:bg-kov-red hover:text-kov-white hover:border-kov-red",
};

function variantStyle(variant: Variant) {
  if (variant === "ghost") return undefined;
  return {
    borderRadius: variant === "pill" ? "var(--radius-pill)" : "var(--radius-sm)",
    borderColor: variant === "primary" ? "transparent" : "var(--kov-border)",
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
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${className}`;
  const style = variantStyle(variant);

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button className={`${classes} disabled:opacity-50`} style={style} {...rest}>
      {children}
    </button>
  );
}
