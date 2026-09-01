import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email/brevo";
import { leadConfirmationSubject, leadConfirmationHtml, newLeadNotificationSubject, newLeadNotificationHtml } from "@/lib/email/leadEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTHS = { name: 200, email: 254, phone: 40, message: 5000, company: 200, project_type: 200 };
const CONTACT_METHODS = ["phone", "video", "in_person"];
const TIMELINES = ["today", "week", "month"];

// Baseline anti-spam, not a hard guarantee — this stops unsophisticated bots
// (generic form-fillers, replayed requests with no timing signal) without
// any new infrastructure (a real rate limiter needs Redis/Vercel KV, which
// isn't set up here). A targeted attacker who studies this exact endpoint
// could still work around it.
const MIN_SUBMIT_MS = 1500;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const company = typeof body.company === "string" ? body.company.trim() : "";
  const projectType = typeof body.project_type === "string" ? body.project_type.trim() : "";
  const contactMethod = typeof body.contact_method === "string" ? body.contact_method.trim() : "";
  const timeline = typeof body.timeline === "string" ? body.timeline.trim() : "";
  const honeypot = typeof body.website === "string" ? body.website.trim() : "";
  const renderedAt = typeof body.rendered_at === "number" ? body.rendered_at : null;

  // Silent success: a bot that gets a normal-looking {ok:true} has no signal
  // to adapt on, unlike a 4xx it could use to tune its next attempt.
  if (honeypot || !renderedAt || Date.now() - renderedAt < MIN_SUBMIT_MS) {
    return NextResponse.json({ ok: true });
  }

  if (!name || name.length > MAX_LENGTHS.name) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!email || email.length > MAX_LENGTHS.email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  if (phone.length > MAX_LENGTHS.phone) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }
  if (message.length > MAX_LENGTHS.message) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }
  if (company.length > MAX_LENGTHS.company) {
    return NextResponse.json({ error: "Invalid company" }, { status: 400 });
  }
  if (projectType.length > MAX_LENGTHS.project_type) {
    return NextResponse.json({ error: "Invalid project type" }, { status: 400 });
  }
  if (contactMethod && !CONTACT_METHODS.includes(contactMethod)) {
    return NextResponse.json({ error: "Invalid contact method" }, { status: 400 });
  }
  if (timeline && !TIMELINES.includes(timeline)) {
    return NextResponse.json({ error: "Invalid timeline" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("leads").insert({
    name,
    email,
    phone: phone || null,
    message: message || null,
    company: company || null,
    project_type: projectType || null,
    contact_method: contactMethod || null,
    timeline: timeline || null,
    source: "site_web",
  });

  if (error) {
    return NextResponse.json({ error: "Could not submit — try again shortly" }, { status: 500 });
  }

  // Best effort — a failed email must never fail the form submission itself,
  // the lead is already safely recorded at this point.
  try {
    const { data: admins } = await supabaseAdmin.from("profiles").select("email, full_name").eq("role", "admin").is("archived_at", null);
    const notificationData = { name, email, company: company || null, message: message || null };
    const [confirmationHtml, notificationHtml] = await Promise.all([
      leadConfirmationHtml({ name }),
      newLeadNotificationHtml(notificationData),
    ]);
    const notificationSubject = newLeadNotificationSubject(notificationData);

    await Promise.allSettled([
      sendEmail({ to: email, toName: name, subject: leadConfirmationSubject(), html: confirmationHtml }),
      ...(admins ?? [])
        .filter((a): a is { email: string; full_name: string | null } => !!a.email)
        .map((admin) =>
          sendEmail({ to: admin.email, toName: admin.full_name ?? undefined, subject: notificationSubject, html: notificationHtml })
        ),
    ]);
  } catch {
    // Swallowed deliberately — see comment above.
  }

  return NextResponse.json({ ok: true });
}
