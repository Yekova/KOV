import type { VisualKey } from "./expertiseLayout";

// Six abstract marks, one per expertise. SVG and CSS only — no canvas, no
// WebGL. They are decoration, so every one is aria-hidden and the card's own
// title carries the meaning.
//
// Each reacts to hover through `.kov-xp-card:hover` in the stylesheet rather
// than through state: the reaction is a transform on a group, which the
// compositor handles for free and which needs no React involvement.
//
// The shapes follow the brief: a sphere under a halo, two nested forms, a
// stacked volume, offset rings, three layers, orbits with nodes. They share a
// stroke weight and a palette so six different drawings still read as one
// family.

const RED = "var(--kov-red)";
const LINE = "rgba(231,231,229,0.28)";

function Strategy() {
  return (
    <svg viewBox="0 0 120 120" className="kov-xp-svg" aria-hidden="true">
      {/* The halo sits behind the sphere, so the sphere reads as lit from
          somewhere rather than as a disc with a ring around it. */}
      <defs>
        <radialGradient id="xp-strategy-halo" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="rgba(227,30,36,0)" />
          <stop offset="82%" stopColor="rgba(227,30,36,0.35)" />
          <stop offset="100%" stopColor="rgba(227,30,36,0)" />
        </radialGradient>
        <radialGradient id="xp-strategy-body" cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#2b2e33" />
          <stop offset="70%" stopColor="#111214" />
          <stop offset="100%" stopColor="#08080a" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="52" fill="url(#xp-strategy-halo)" />
      <g className="kov-xp-spin">
        <circle cx="60" cy="60" r="44" fill="none" stroke={RED} strokeWidth="1" opacity="0.5" />
        <circle cx="60" cy="16" r="2.4" fill={RED} />
      </g>
      <circle cx="60" cy="60" r="33" fill="url(#xp-strategy-body)" stroke={LINE} strokeWidth="0.8" />
    </svg>
  );
}

function Design() {
  return (
    <svg viewBox="0 0 120 120" className="kov-xp-svg" aria-hidden="true">
      {/* Two forms sharing an overlap — an identity is the intersection of a
          shape and a counter-shape, not either alone. */}
      <g className="kov-xp-nest">
        <circle cx="48" cy="60" r="30" fill="rgba(227,30,36,0.08)" stroke={RED} strokeWidth="1" opacity="0.75" />
        <rect x="42" y="30" width="60" height="60" rx="16" fill="rgba(231,231,229,0.03)" stroke={LINE} strokeWidth="1" />
      </g>
      <circle cx="48" cy="60" r="3" fill={RED} />
    </svg>
  );
}

function Development() {
  return (
    <svg viewBox="0 0 120 120" className="kov-xp-svg" aria-hidden="true">
      {/* An isometric volume: three faces from six points, so the shape
          reads as built rather than drawn. */}
      <g className="kov-xp-cube">
        <path d="M60 22 L98 44 L60 66 L22 44 Z" fill="rgba(231,231,229,0.06)" stroke={LINE} strokeWidth="1" />
        <path d="M22 44 L60 66 L60 100 L22 78 Z" fill="rgba(10,10,10,0.8)" stroke={LINE} strokeWidth="1" />
        <path d="M98 44 L60 66 L60 100 L98 78 Z" fill="rgba(227,30,36,0.12)" stroke={RED} strokeWidth="1" opacity="0.8" />
      </g>
    </svg>
  );
}

function Motion() {
  return (
    <svg viewBox="0 0 120 120" className="kov-xp-svg" aria-hidden="true">
      {/* Offset arcs. Each is the same curve moved along, which is what
          motion is: one thing, later. */}
      <g className="kov-xp-rings">
        <circle cx="42" cy="60" r="26" fill="none" stroke={LINE} strokeWidth="1" opacity="0.5" />
        <circle cx="60" cy="60" r="26" fill="none" stroke={LINE} strokeWidth="1" opacity="0.75" />
        <circle cx="78" cy="60" r="26" fill="none" stroke={RED} strokeWidth="1.2" />
      </g>
      <circle cx="78" cy="34" r="2.6" fill={RED} />
    </svg>
  );
}

function Systems() {
  return (
    <svg viewBox="0 0 120 120" className="kov-xp-svg" aria-hidden="true">
      {/* Three plates in perspective. They separate on hover, which is the
          whole point of a system: the layers are real and they come apart. */}
      <g className="kov-xp-layers">
        <path
          className="kov-xp-layer kov-xp-layer--3"
          d="M60 74 L104 92 L60 110 L16 92 Z"
          fill="rgba(10,10,10,0.85)"
          stroke={LINE}
          strokeWidth="0.9"
        />
        <path
          className="kov-xp-layer kov-xp-layer--2"
          d="M60 48 L104 66 L60 84 L16 66 Z"
          fill="rgba(20,21,24,0.9)"
          stroke={LINE}
          strokeWidth="0.9"
        />
        <path
          className="kov-xp-layer kov-xp-layer--1"
          d="M60 22 L104 40 L60 58 L16 40 Z"
          fill="rgba(227,30,36,0.12)"
          stroke={RED}
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}

function Integration() {
  return (
    <svg viewBox="0 0 120 120" className="kov-xp-svg" aria-hidden="true">
      {/* A centre with things in orbit around it, joined by real lines —
          integration drawn as what it is rather than as a plug icon. */}
      <ellipse cx="60" cy="60" rx="46" ry="20" fill="none" stroke={LINE} strokeWidth="0.9" opacity="0.6" />
      <ellipse
        cx="60"
        cy="60"
        rx="46"
        ry="20"
        fill="none"
        stroke={LINE}
        strokeWidth="0.9"
        opacity="0.45"
        transform="rotate(60 60 60)"
      />
      <ellipse
        cx="60"
        cy="60"
        rx="46"
        ry="20"
        fill="none"
        stroke={RED}
        strokeWidth="1"
        opacity="0.55"
        transform="rotate(-60 60 60)"
      />
      <g className="kov-xp-nodes">
        <circle cx="106" cy="60" r="3" fill={RED} />
        <circle cx="37" cy="21" r="2.6" fill="rgba(231,231,229,0.75)" />
        <circle cx="37" cy="99" r="2.6" fill="rgba(231,231,229,0.55)" />
      </g>
      <circle cx="60" cy="60" r="9" fill="#0a0a0a" stroke={RED} strokeWidth="1.1" />
    </svg>
  );
}

const VISUALS: Record<VisualKey, () => React.JSX.Element> = {
  strategy: Strategy,
  design: Design,
  development: Development,
  motion: Motion,
  systems: Systems,
  integration: Integration,
};

export function ExpertiseVisual({ visual }: { visual: VisualKey }) {
  const Shape = VISUALS[visual];
  return <Shape />;
}
