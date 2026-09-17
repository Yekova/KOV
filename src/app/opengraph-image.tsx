import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The site's social card.
//
// Until now og:image pointed at /kov/brand/kov-wordmark-bone.png, which is
// 1116x209 — a 5.3:1 strip. Every platform that renders a link preview wants
// 1.91:1 (1200x630) and either letterboxes or centre-crops anything else, so
// a share on LinkedIn, X, Slack or WhatsApp showed the wordmark squashed into
// a thin band or cropped down to two letters. The site's business card, and
// it was malformed everywhere it mattered.
//
// Composed rather than authored: the real wordmark file is embedded as-is, so
// this is KOV's actual typography rather than an approximation of it, and the
// only other ingredients are the brand's own tokens and the tagline already
// used as the site title. Nothing here is invented.
//
// Generated at build time (no request-time API is used), so it costs one PNG
// in the build output and nothing per share.
export const alt = "KOV — On construit ce que les gens retiennent.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Token values are duplicated as literals on purpose: Satori resolves no CSS
// custom properties, so var(--kov-red) would render as nothing at all.
const BLACK = "#0a0a0a";
const RED = "#e31e24";
const BONE = "#e7e7e5";
const STEEL = "#777774";

export default async function OpengraphImage() {
  const wordmark = await readFile(join(process.cwd(), "public/kov/brand/kov-wordmark-bone.png"));
  const wordmarkSrc = `data:image/png;base64,${wordmark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BLACK,
          position: "relative",
        }}
      >
        {/* The red signature rule down the left edge — the one graphic
            constant across the site's own surfaces. */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 12, background: RED }} />

        {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders to a PNG; next/image has no meaning inside an ImageResponse */}
        <img src={wordmarkSrc} alt="" width={520} height={97} />

        <div
          style={{
            marginTop: 44,
            fontSize: 34,
            color: BONE,
            letterSpacing: "-0.01em",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          On construit ce que les gens retiennent.
        </div>

        <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 1, background: STEEL }} />
          <div style={{ fontSize: 18, color: STEEL, letterSpacing: "0.22em" }}>BORDEAUX · FRANCE</div>
          <div style={{ width: 40, height: 1, background: STEEL }} />
        </div>
      </div>
    ),
    size
  );
}
