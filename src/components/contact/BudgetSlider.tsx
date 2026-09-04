"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";

export const BUDGET_MIN = 2000;
export const BUDGET_MAX = 30000;
const BUDGET_STEP = 500;
const HANDLE_SIZE = 26;

export function formatBudget(value: number): string {
  if (value >= BUDGET_MAX) return `${BUDGET_MAX.toLocaleString("fr-FR")} € +`;
  return `${value.toLocaleString("fr-FR")} €`;
}

// One character slot — digits roll (old one slides up and out, new one
// slides in from below) via AnimatePresence keyed on the character itself;
// spaces/€ just render statically, nothing to roll.
function RollingChar({ char }: { char: string }) {
  if (!/\d/.test(char)) {
    return <span className="inline-block">{char === " " ? " " : char}</span>;
  }
  return (
    <span className="relative inline-block overflow-hidden align-bottom tabular-nums" style={{ height: "1em", width: "0.62em" }}>
      <AnimatePresence initial={false}>
        <motion.span
          key={char}
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function RollingNumber({ value }: { value: string }) {
  return (
    <span className="inline-flex items-baseline">
      {value.split("").map((char, i) => (
        <RollingChar key={i} char={char} />
      ))}
    </span>
  );
}

interface BudgetSliderProps {
  value: number;
  onChange: (value: number) => void;
  onInteract: () => void;
}

// Same drag mechanics as ActivationSlider.tsx (framer-motion's native
// drag="x" + dragConstraints, not hand-rolled pointer math) applied to a
// value range instead of a 0→1 activation progress. The rolling number
// above is purely presentational — it reads `value`, drag math never
// touches it directly.
export function BudgetSlider({ value, onChange, onInteract }: BudgetSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useMotionValue(0);
  const draggingRef = useRef(false);
  const maxTravel = Math.max(1, trackWidth - HANDLE_SIZE);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver((entries) => setTrackWidth(entries[0].contentRect.width));
    ro.observe(track);
    return () => ro.disconnect();
  }, []);

  // Keeps the handle in sync with `value` (initial position, keyboard
  // nudges, track resize) — skipped while actively dragging, since the
  // drag gesture itself already owns `x` for that moment.
  useEffect(() => {
    if (draggingRef.current) return;
    const progress = (value - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN);
    x.set(progress * maxTravel);
  }, [value, maxTravel, x]);

  function commitFromX(latest: number) {
    const progress = maxTravel > 0 ? latest / maxTravel : 0;
    const raw = BUDGET_MIN + progress * (BUDGET_MAX - BUDGET_MIN);
    const stepped = Math.round(raw / BUDGET_STEP) * BUDGET_STEP;
    onChange(Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, stepped)));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onInteract();
      onChange(Math.min(BUDGET_MAX, value + BUDGET_STEP));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onInteract();
      onChange(Math.max(BUDGET_MIN, value - BUDGET_STEP));
    }
  }

  function handleTrackClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return; // ignore bubbled clicks from the handle
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clamped = Math.min(maxTravel, Math.max(0, e.clientX - rect.left - HANDLE_SIZE / 2));
    x.set(clamped);
    commitFromX(clamped);
    onInteract();
  }

  const progressPercent = ((value - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <span className="font-display text-kov-bone uppercase" style={{ fontSize: "clamp(30px, 5vw, 44px)" }}>
          <RollingNumber value={formatBudget(value)} />
        </span>
      </div>

      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative w-full cursor-pointer"
        style={{ height: 6, background: "var(--kov-border)", borderRadius: "var(--radius-pill)" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pointer-events-none"
          style={{ width: `${progressPercent}%`, background: "var(--kov-red)", borderRadius: "var(--radius-pill)" }}
        />

        <motion.div
          role="slider"
          tabIndex={0}
          aria-label="Budget estimé"
          aria-valuemin={BUDGET_MIN}
          aria-valuemax={BUDGET_MAX}
          aria-valuenow={value}
          aria-valuetext={formatBudget(value)}
          drag="x"
          dragConstraints={{ left: 0, right: maxTravel }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={() => {
            draggingRef.current = true;
            onInteract();
          }}
          onDrag={() => commitFromX(x.get())}
          onDragEnd={() => {
            draggingRef.current = false;
          }}
          onPointerDown={onInteract}
          onKeyDown={handleKeyDown}
          style={{ x, top: "50%", marginTop: -HANDLE_SIZE / 2, width: HANDLE_SIZE, height: HANDLE_SIZE, outlineColor: "var(--kov-red)" }}
          className="absolute rounded-full cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ background: "var(--kov-red)", boxShadow: "0 0 0 4px var(--kov-black), 0 2px 10px rgba(0,0,0,0.45)" }}
          />
        </motion.div>
      </div>

      <div className="flex justify-between mt-3">
        <span className="text-kov-steel text-[10px] uppercase tracking-widest">{formatBudget(BUDGET_MIN)}</span>
        <span className="text-kov-steel text-[10px] uppercase tracking-widest">{formatBudget(BUDGET_MAX)}</span>
      </div>
    </div>
  );
}
