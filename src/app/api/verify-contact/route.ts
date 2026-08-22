import { NextResponse } from "next/server";
import { resolveMx } from "node:dns/promises";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIMEOUT_MS = 3000;

// A domain that resolves with zero MX records genuinely can't receive mail —
// worth blocking on. Anything else (DNS timeout, resolver hiccup) fails open
// rather than rejecting a real lead over transient infrastructure noise.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ valid: false, reason: "format" });
  }

  const domain = email.split("@")[1];

  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
    ]);
    return NextResponse.json({ valid: records.length > 0 });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") {
      return NextResponse.json({ valid: false, reason: "mx" });
    }
    return NextResponse.json({ valid: true });
  }
}
