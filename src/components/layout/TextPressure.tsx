"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import "./TextPressure.css";

interface TextPressureProps {
  text: string;
  fontFamily: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  textColor?: string;
  strokeColor?: string;
  className?: string;
  minFontSize?: number;
}

interface Point {
  x: number;
  y: number;
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function attrForDistance(distanceValue: number, maxDistance: number, minVal: number, maxVal: number) {
  const val = maxVal - Math.abs((maxVal * distanceValue) / maxDistance);
  return Math.max(minVal, val + minVal);
}

// Adapted from reactbits.dev's TextPressure (itself ported from
// https://codepen.io/JuanFuentes/full/rgXKGQ) — each character's
// variable-font weight/width reacts to distance from the cursor. Three
// adaptations from the original for this codebase:
// 1. Font loading goes through next/font/google (the caller passes the
//    resolved `fontFamily`) instead of a runtime CSS @import, which would
//    be render-blocking and bypass Next's font optimization.
// 2. Gated on prefers-reduced-motion (skips the rAF loop, renders static)
//    and on IntersectionObserver (only animates while actually in view —
//    this lives in a footer, below the fold on every page; running the
//    loop site-wide before it's ever visible would be pure waste).
// 3. Rendered as a <p>, not an <h1> — a decorative wordmark repeated in
//    every page's footer shouldn't compete with that page's real heading.
//    The decomposed per-character spans are aria-hidden with a single
//    aria-label on the wrapper, so screen readers announce one clean word.
export function TextPressure({
  text,
  fontFamily,
  width = true,
  weight = true,
  italic = false,
  alpha = false,
  flex = true,
  stroke = false,
  scale = false,
  textColor = "#FFFFFF",
  strokeColor = "#FFFFFF",
  className = "",
  minFontSize = 24,
}: TextPressureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const cursorRef = useRef<Point>({ x: 0, y: 0 });

  const [fontSize, setFontSize] = useState(minFontSize);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);
  const [inView, setInView] = useState(false);
  // Lazy initializer, not a setState-in-effect call — see Reveal.tsx.
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const chars = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion || !inView) return;

    function handleMouseMove(event: MouseEvent) {
      cursorRef.current.x = event.clientX;
      cursorRef.current.y = event.clientY;
    }
    function handleTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      cursorRef.current.x = touch.clientX;
      cursorRef.current.y = touch.clientY;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = rect.left + rect.width / 2;
      mouseRef.current.y = rect.top + rect.height / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [reducedMotion, inView]);

  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;
    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();

    const newFontSize = Math.max(containerW / (chars.length / 2), minFontSize);
    setFontSize(newFontSize);
    setScaleY(1);
    setLineHeight(1);

    requestAnimationFrame(() => {
      if (!titleRef.current) return;
      const textRect = titleRef.current.getBoundingClientRect();
      if (scale && textRect.height > 0) {
        const yRatio = containerH / textRect.height;
        setScaleY(yRatio);
        setLineHeight(yRatio);
      }
    });
  }, [chars.length, minFontSize, scale]);

  useEffect(() => {
    setSize();
    let timer: ReturnType<typeof setTimeout> | null = null;
    function debouncedSetSize() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(setSize, 100);
    }
    window.addEventListener("resize", debouncedSetSize);
    return () => {
      window.removeEventListener("resize", debouncedSetSize);
      if (timer) clearTimeout(timer);
    };
  }, [setSize]);

  useEffect(() => {
    if (reducedMotion || !inView) return;

    let rafId: number;
    function animate() {
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15;

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = titleRect.width / 2;

        spansRef.current.forEach((span) => {
          if (!span) return;
          const rect = span.getBoundingClientRect();
          const charCenter = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          const d = distance(mouseRef.current, charCenter);

          const wdth = width ? Math.floor(attrForDistance(d, maxDist, 5, 200)) : 100;
          const wght = weight ? Math.floor(attrForDistance(d, maxDist, 100, 900)) : 400;
          const italVal = italic ? attrForDistance(d, maxDist, 0, 1).toFixed(2) : 0;
          const alphaVal = alpha ? attrForDistance(d, maxDist, 0, 1).toFixed(2) : 1;

          const newSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
          if (span.style.fontVariationSettings !== newSettings) {
            span.style.fontVariationSettings = newSettings;
          }
          if (alpha && span.style.opacity !== String(alphaVal)) {
            span.style.opacity = String(alphaVal);
          }
        });
      }
      rafId = requestAnimationFrame(animate);
    }
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [width, weight, italic, alpha, reducedMotion, inView]);

  const dynamicClassName = [className, flex ? "text-pressure-flex" : "", stroke ? "text-pressure-stroke" : ""]
    .filter(Boolean)
    .join(" ");

  const titleStyle = {
    fontFamily,
    textTransform: "uppercase",
    fontSize,
    lineHeight,
    transform: `scale(1, ${scaleY})`,
    transformOrigin: "center top",
    margin: 0,
    textAlign: "center",
    userSelect: "none",
    whiteSpace: "nowrap",
    fontWeight: 100,
    width: "100%",
    color: textColor,
    "--text-pressure-stroke-color": strokeColor,
  } as CSSProperties;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <p ref={titleRef} aria-label={text} className={dynamicClassName} style={titleStyle}>
        <span aria-hidden="true" className="contents">
          {chars.map((char, index) => (
            <span
              key={index}
              ref={(el) => {
                spansRef.current[index] = el;
              }}
              data-char={char}
              style={{ display: "inline-block", color: stroke ? undefined : textColor }}
            >
              {char}
            </span>
          ))}
        </span>
      </p>
    </div>
  );
}
