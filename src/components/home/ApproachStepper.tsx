interface ApproachStepperProps {
  steps: { number: string; label: string }[];
  /** Continuous 0..steps.length-1 — same segment value driving the card
   * coverflow's distance math, rounded here since a stepper only makes
   * sense showing one discrete "current" step, not a blend between two. */
  activeProgress: number;
}

// A vertical numbered list (01..N) with a connecting line and a dot that
// highlights whichever step is current — the reference spec's own
// right-most column, tracking the coverflow's active card as the visitor
// scrolls. No existing component matched this shape (KovSectionIndicator
// is a single floating badge, not a list); built fresh.
export function ApproachStepper({ steps, activeProgress }: ApproachStepperProps) {
  const activeIndex = Math.round(activeProgress);

  return (
    <ol className="relative flex flex-col justify-between h-full py-1">
      <div aria-hidden="true" className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: "var(--glass-border)" }} />
      {steps.map((step, i) => {
        const active = i === activeIndex;
        return (
          <li key={step.number} className="relative flex items-center gap-3 pl-6">
            <span
              aria-hidden="true"
              className="absolute left-0 rounded-full transition-all duration-300"
              style={{
                width: active ? 11 : 7,
                height: active ? 11 : 7,
                marginLeft: active ? -1 : 1,
                background: active ? "var(--kov-red)" : "var(--kov-border)",
                boxShadow: active ? "0 0 10px rgba(227,30,36,0.6)" : "none",
              }}
            />
            <span
              className="font-mono text-xs shrink-0 transition-colors duration-300"
              style={{ color: active ? "var(--kov-red)" : "var(--kov-steel)" }}
            >
              {step.number}
            </span>
            <span
              className="text-xs uppercase tracking-wide transition-colors duration-300 whitespace-nowrap"
              style={{ color: active ? "var(--kov-bone)" : "var(--kov-steel)" }}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
