import type { ProcessVisualKey } from "./processPanels";

// One drawn artefact per step of the process.
//
// These stand in for photographs, and they are drawings rather than stock
// imagery on purpose: a photograph of an office says nothing about the
// difference between structuring and designing, while a sitemap and a type
// scale say it immediately. They also cost nothing to ship — no files, no
// loader, no layout shift — and they cannot go stale.
//
// One visual language across all seven: a 2:1 frame, 1px strokes, the same
// four greys, and red used once per drawing on the thing that matters. Drawn
// at 400x200 and scaled with preserveAspectRatio="meet", so nothing is ever
// cropped however wide the open panel gets.
//
// All decoration: every one is aria-hidden and the panel's own heading and
// paragraph carry the meaning.

const RED = "#e31e24";
const LINE = "rgba(231,231,229,0.32)";
const DIM = "rgba(231,231,229,0.22)";
const FAINT = "rgba(231,231,229,0.14)";
const FILL = "rgba(231,231,229,0.05)";
const GRID = "rgba(231,231,229,0.07)";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid meet"
      className="kov-proc-svg"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** A text line, the unit most of these drawings are made of. */
function Bar({ x, y, w, h = 5, fill = FAINT }: { x: number; y: number; w: number; h?: number; fill?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />;
}

// 01 — a brief, read and marked up. The annotation in the margin is the
// point: the step is not receiving a document, it is interrogating one.
function Discover() {
  const lines: [number, number][] = [
    [56, 150],
    [70, 128],
    [84, 156],
    [98, 110],
    [112, 142],
    [126, 96],
    [140, 132],
    [154, 118],
  ];

  return (
    <Frame>
      <rect x="112" y="20" width="196" height="160" rx="7" fill={FILL} stroke={FAINT} />
      <Bar x={130} y={32} w={78} h={9} fill={DIM} />
      {lines.map(([y, w]) => (
        <Bar key={y} x={130} y={y} w={w} fill={y === 84 ? "rgba(227,30,36,0.5)" : FAINT} />
      ))}

      {/* The passage that got someone's attention. */}
      <rect x="121" y="79" width="3" height="33" rx="1.5" fill={RED} />

      {/* And the note in the margin about it. */}
      <circle cx="80" cy="95" r="10" fill="none" stroke={RED} strokeWidth="1.2" />
      <circle cx="80" cy="95" r="2.5" fill={RED} />
      <path d="M90 95 L112 89" stroke={RED} strokeWidth="1" opacity="0.5" />
      <Bar x={60} y={130} w={34} h={4} />
      <Bar x={60} y={142} w={22} h={4} />
    </Frame>
  );
}

// 02 — a sitemap. Boxes and the lines between them, which is what an
// architecture is before anyone has chosen a typeface.
function Structure() {
  return (
    <Frame>
      <g stroke={LINE} strokeWidth="1" fill="none">
        <path d="M200 44 L200 62 M104 62 L296 62 M104 62 L104 80 M200 62 L200 80 M296 62 L296 80" />
        <path d="M200 100 L200 116 M152 116 L248 116 M152 116 L152 132 M200 116 L200 132 M248 116 L248 132" />
        <path d="M104 100 L104 126 M296 100 L296 126" />
      </g>

      <rect x="176" y="22" width="48" height="22" rx="5" fill="rgba(227,30,36,0.10)" stroke={RED} strokeWidth="1.1" />

      {[80, 176, 272].map((x) => (
        <rect key={x} x={x} y="80" width="48" height="20" rx="5" fill={FILL} stroke={LINE} />
      ))}

      {[132, 180, 228].map((x) => (
        <rect
          key={x}
          x={x}
          y="132"
          width="40"
          height="18"
          rx="4"
          fill={x === 180 ? "rgba(227,30,36,0.12)" : FILL}
          stroke={x === 180 ? RED : FAINT}
          strokeOpacity={x === 180 ? 0.7 : 1}
        />
      ))}

      <rect x="80" y="126" width="48" height="18" rx="4" fill={FILL} stroke={FAINT} />
      <rect x="272" y="126" width="48" height="18" rx="4" fill={FILL} stroke={FAINT} />
    </Frame>
  );
}

// 03 — a type scale, a palette and one component. The three things a
// direction actually consists of, rather than a picture of a screen.
function Design() {
  const swatches = ["rgba(231,231,229,0.88)", "rgba(231,231,229,0.42)", "rgba(231,231,229,0.18)", "#141416", RED];

  return (
    <Frame>
      <rect x="48" y="34" width="136" height="22" rx="3" fill="rgba(231,231,229,0.42)" />
      <path d="M48 63 L200 63" stroke={GRID} />
      <rect x="48" y="72" width="104" height="15" rx="3" fill="rgba(231,231,229,0.26)" />
      <path d="M48 94 L200 94" stroke={GRID} />
      <Bar x={48} y={103} w={140} />
      <Bar x={48} y={115} w={120} h={4} />
      <Bar x={48} y={126} w={132} h={4} />

      {swatches.map((fill, i) => (
        <rect
          key={fill}
          x={48 + i * 26}
          y="148"
          width="20"
          height="20"
          rx="4"
          fill={fill}
          stroke={FAINT}
          strokeWidth="0.8"
        />
      ))}

      <rect x="228" y="34" width="128" height="122" rx="10" fill="rgba(231,231,229,0.04)" stroke={LINE} />
      <rect x="242" y="48" width="100" height="44" rx="6" fill={FILL} stroke={FAINT} strokeWidth="0.8" />
      <Bar x={242} y={102} w={76} fill={DIM} />
      <Bar x={242} y={114} w={58} h={4} />
      <rect
        x="242"
        y="129"
        width="46"
        height="14"
        rx="7"
        fill="rgba(227,30,36,0.18)"
        stroke={RED}
        strokeOpacity="0.6"
      />
    </Frame>
  );
}

// 04 — an editor. Tokens as bars rather than as lettering: real code at this
// size is illegible, and illegible lettering reads as a texture pretending
// to be code.
function Build() {
  const rows: { y: number; spans: [number, number, string][] }[] = [
    { y: 60, spans: [[116, 34, "rgba(227,30,36,0.55)"], [156, 58, DIM]] },
    { y: 74, spans: [[128, 44, DIM], [178, 30, FAINT]] },
    { y: 88, spans: [[128, 26, "rgba(227,30,36,0.4)"], [160, 72, FAINT]] },
    { y: 102, spans: [[140, 52, FAINT], [198, 34, DIM]] },
    { y: 116, spans: [[140, 38, FAINT]] },
    { y: 130, spans: [[128, 64, DIM]] },
    { y: 144, spans: [[116, 42, "rgba(227,30,36,0.4)"], [164, 48, FAINT]] },
    { y: 158, spans: [[116, 28, FAINT]] },
  ];

  return (
    <Frame>
      <rect x="56" y="22" width="288" height="156" rx="9" fill="rgba(10,10,10,0.55)" stroke={LINE} />
      <path d="M56 46 L344 46 M104 46 L104 178" stroke={FAINT} />
      <circle cx="74" cy="34" r="3" fill={RED} fillOpacity="0.5" />
      <circle cx="86" cy="34" r="3" fill={DIM} />
      <circle cx="98" cy="34" r="3" fill={FAINT} />

      {/* The line that just changed. */}
      <rect x="104" y="110" width="240" height="14" fill="rgba(227,30,36,0.07)" />
      <rect x="57" y="110" width="3" height="14" fill={RED} />

      {rows.map((row) => (
        <g key={row.y}>
          <Bar x={86} y={row.y + 1} w={9} h={3} fill={GRID} />
          {row.spans.map(([x, w, fill]) => (
            <Bar key={x} x={x} y={row.y} w={w} fill={fill} />
          ))}
        </g>
      ))}
    </Frame>
  );
}

// 05 — the curve itself, plotted, with the keyframes under it. Drawn from
// the site's own easing: control points 0.22/1 and 0.36/1, the same curve
// the rest of these panels move on.
function Motion() {
  return (
    <Frame>
      <rect x="56" y="22" width="288" height="112" rx="7" fill={FILL} stroke={FAINT} />
      <g stroke={GRID}>
        <path d="M56 50 L344 50 M56 78 L344 78 M56 106 L344 106" />
        <path d="M104 22 L104 134 M152 22 L152 134 M200 22 L200 134 M248 22 L248 134 M296 22 L296 134" />
      </g>

      <path d="M56 134 C119 22 160 22 344 22" fill="none" stroke={LINE} strokeWidth="1.6" strokeLinecap="round" />

      {/* Where the curve is halfway through its time but nearly finished
          moving — which is the whole argument for using it. */}
      <path d="M155 36 L155 134 M56 36 L155 36" stroke={RED} strokeOpacity="0.28" strokeDasharray="3 4" />
      <circle cx="155" cy="36" r="4" fill={RED} />

      <path d="M56 162 L344 162" stroke={LINE} />
      {[56, 128, 200, 272, 344].map((x) => (
        <path
          key={x}
          d={`M${x} 156 l5 6 l-5 6 l-5 -6 z`}
          fill={x === 200 ? RED : DIM}
        />
      ))}
    </Frame>
  );
}

// 06 — a real browser and a list of checks. No score, no percentage: the
// step is the verification, and inventing a number for it would be inventing
// a result.
function Launch() {
  const checks: [number, number][] = [
    [40, 84],
    [66, 68],
    [92, 92],
    [118, 74],
    [144, 60],
  ];

  return (
    <Frame>
      <rect x="48" y="30" width="158" height="126" rx="8" fill="rgba(10,10,10,0.5)" stroke={LINE} />
      <path d="M48 52 L206 52" stroke={FAINT} />
      <circle cx="62" cy="41" r="2.5" fill={FAINT} />
      <circle cx="72" cy="41" r="2.5" fill={FAINT} />
      <circle cx="82" cy="41" r="2.5" fill={FAINT} />
      <rect x="96" y="36" width="94" height="10" rx="5" fill="rgba(231,231,229,0.07)" />
      <rect x="62" y="64" width="130" height="42" rx="5" fill={FILL} stroke={FAINT} strokeWidth="0.8" />
      <Bar x={62} y={116} w={96} fill={DIM} />
      <Bar x={62} y={128} w={72} h={4} />
      <rect
        x="62"
        y="140"
        width="36"
        height="11"
        rx="5.5"
        fill="rgba(227,30,36,0.2)"
        stroke={RED}
        strokeOpacity="0.5"
      />

      {checks.map(([y, w], i) => {
        const pending = i === checks.length - 1;
        return (
          <g key={y}>
            <rect
              x="232"
              y={y - 8}
              width="16"
              height="16"
              rx="4"
              fill={FILL}
              stroke={pending ? RED : LINE}
              strokeOpacity={pending ? 0.75 : 1}
            />
            {pending ? (
              <circle cx="240" cy={y} r="3.4" fill="none" stroke={RED} strokeWidth="1.6" />
            ) : (
              <path
                d={`M236 ${y} l3 3.6 l6 -7.4`}
                fill="none"
                stroke="rgba(231,231,229,0.7)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <Bar x={258} y={y - 2.5} w={w} fill={pending ? DIM : FAINT} />
          </g>
        );
      })}
    </Frame>
  );
}

// 07 — versions stacking up and a line that keeps climbing past the last
// node it has. The dashes are the argument: the launch was not the end.
function Evolve() {
  return (
    <Frame>
      <rect x="44" y="64" width="132" height="92" rx="9" fill="rgba(231,231,229,0.03)" stroke={GRID} />
      <rect x="56" y="52" width="132" height="92" rx="9" fill="rgba(231,231,229,0.05)" stroke={FAINT} />
      <rect x="68" y="40" width="132" height="92" rx="9" fill="rgba(10,10,10,0.6)" stroke={LINE} />
      <Bar x={84} y={58} w={72} h={6} fill={DIM} />
      <Bar x={84} y={74} w={96} h={4} />
      <Bar x={84} y={86} w={80} h={4} />
      <Bar x={84} y={98} w={88} h={4} />
      <rect
        x="84"
        y="111"
        width="34"
        height="11"
        rx="5.5"
        fill="rgba(227,30,36,0.18)"
        stroke={RED}
        strokeOpacity="0.5"
      />

      <path
        d="M236 160 L266 160 L266 134 L296 134 L296 106 L326 106 L326 72"
        fill="none"
        stroke={LINE}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="266" cy="134" r="3" fill={FAINT} />
      <circle cx="296" cy="106" r="3" fill={DIM} />
      <circle cx="326" cy="72" r="4.5" fill={RED} />
      <path d="M326 72 L368 44" stroke={RED} strokeOpacity="0.45" strokeWidth="1.4" strokeDasharray="3 5" />
    </Frame>
  );
}

const VISUALS: Record<ProcessVisualKey, () => React.JSX.Element> = {
  discover: Discover,
  structure: Structure,
  design: Design,
  build: Build,
  motion: Motion,
  launch: Launch,
  evolve: Evolve,
};

export function ProcessVisual({ visual }: { visual: ProcessVisualKey }) {
  const Scene = VISUALS[visual];
  return <Scene />;
}
