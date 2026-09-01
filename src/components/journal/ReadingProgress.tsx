"use client";

import { useState, type RefObject } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useMotionValueEvent } from "framer-motion";

const CIRCLE_SIZE = 44;
const STROKE_WIDTH = 3;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ReadingProgress({
  targetRef,
  onPercentChange,
}: {
  targetRef: RefObject<HTMLElement | null>;
  onPercentChange?: (percent: number) => void;
}) {
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start 80px", "end end"] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  const strokeDashoffset = useTransform(scrollYProgress, (v) => CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, v))));

  const [percent, setPercent] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const rounded = Math.round(Math.min(1, Math.max(0, latest)) * 100);
    setPercent(rounded);
    onPercentChange?.(rounded);
  });

  return (
    <>
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 h-[3px] origin-left"
        style={{ scaleX, background: "var(--kov-red)", zIndex: 60 }}
      />

      <AnimatePresence>
        {percent > 3 && percent < 98 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 right-6 flex items-center justify-center"
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              background: "var(--kov-carbon)",
              border: "1px solid var(--kov-border)",
              borderRadius: "var(--radius-pill)",
              zIndex: 60,
            }}
          >
            <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              <circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS} fill="none" stroke="var(--kov-border)" strokeWidth={STROKE_WIDTH} />
              <motion.circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--kov-red)"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={CIRCUMFERENCE}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-kov-bone text-[10px] font-medium relative">{percent}%</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
