import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Where the Brands Gallery's events land.
//
// Through the server and not straight into the table with the anonymous
// key, for one reason that decides the whole design: these numbers end up
// on an invoice. A browser that can write them is a browser that can
// inflate a sponsor's figures, and a report built on that is worse than no
// report at all.
//
// So the route does three things the client cannot be trusted to do. It
// timestamps on the server. It resolves every event against the live
// gallery and drops anything that does not correspond to a placement that
// is actually standing right now — which is also what makes an event for a
// brand that does not exist unwritable rather than merely wrong. And it
// stores nothing that identifies anyone: no IP, no user agent, no
// referrer, just an opaque per-page-load token the client keeps in memory.

const EVENTS = new Set(["brand_stand_view", "brand_stand_interact", "brand_video_play", "brand_cta_click"]);

/** One walk through a gallery does not produce hundreds of events — the
 *  bands that emit them are crossed a handful of times. A batch larger
 *  than this is not a visit. */
const MAX_BATCH = 24;

/** Best-effort, and stated as such: a real limiter needs Redis or Vercel
 *  KV, neither of which is set up here, and this map lives per serverless
 *  instance. It stops a loop in a console tab, not a distributed attempt —
 *  the resolution against live placements below is what actually bounds
 *  the damage. Same trade-off, and the same honesty about it, as
 *  /api/contact. */
const RATE = new Map<string, { count: number; until: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;

function overRate(key: string) {
  const now = Date.now();
  const entry = RATE.get(key);
  if (!entry || entry.until < now) {
    RATE.set(key, { count: 1, until: now + WINDOW_MS });
    // The map is per-instance and short-lived, but an instance that stays
    // warm for hours should not grow one entry per visitor forever.
    if (RATE.size > 5000) {
      for (const [k, v] of RATE) if (v.until < now) RATE.delete(k);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const session = typeof body.session === "string" ? body.session.trim() : "";
  const rawEvents = Array.isArray(body.events) ? body.events : null;

  if (session.length < 8 || session.length > 64 || !rawEvents || rawEvents.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (rawEvents.length > MAX_BATCH) {
    return NextResponse.json({ error: "Batch too large" }, { status: 413 });
  }
  if (overRate(session)) {
    return NextResponse.json({ ok: true, written: 0 }, { status: 202 });
  }

  // What is standing in the room right now. One read, and the only thing
  // that decides whether an event is writable at all.
  const { data: live, error: liveError } = await supabaseAdmin
    .from("public_gallery")
    .select("placement_id,slot_id");

  if (liveError) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const bySlot = new Map((live ?? []).map((row) => [row.slot_id as string, row.placement_id as string]));

  const rows: { placement_id: string; slot_id: string; event: string; session: string }[] = [];
  for (const raw of rawEvents) {
    if (typeof raw !== "object" || raw === null) continue;
    const entry = raw as Record<string, unknown>;
    const event = typeof entry.event === "string" ? entry.event : "";
    const slot = typeof entry.slot === "string" ? entry.slot : "";
    if (!EVENTS.has(event)) continue;

    const placement = bySlot.get(slot);
    // No live placement at that address: nothing to attribute the event to,
    // so it is dropped rather than stored against nothing.
    if (!placement) continue;

    rows.push({ placement_id: placement, slot_id: slot, event, session });
  }

  if (rows.length === 0) return NextResponse.json({ ok: true, written: 0 });

  const { error } = await supabaseAdmin.from("brand_events").insert(rows);
  if (error) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  return NextResponse.json({ ok: true, written: rows.length });
}
