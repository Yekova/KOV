import "server-only";
import fs from "node:fs";
import path from "node:path";

// Read once at module load and embed as a buffer rather than passing a file
// path string to react-pdf's <Image>: serverless bundlers don't always keep
// the same relationship between process.cwd() and public/ that local dev
// has, and a buffer sidesteps that entirely.
const LOGO_PATH = path.join(process.cwd(), "public/kov/brand/kov-wordmark-black.png");

export const KOV_LOGO_SRC = { data: fs.readFileSync(LOGO_PATH), format: "png" as const };
