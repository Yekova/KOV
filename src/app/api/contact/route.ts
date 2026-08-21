import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LENGTHS = { name: 200, email: 254, phone: 40, message: 5000, company: 200, project_type: 200 };
const CONTACT_METHODS = ["phone", "video", "in_person"];
const TIMELINES = ["today", "week", "month"];

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
    source: "contact-page",
  });

  if (error) {
    return NextResponse.json({ error: "Could not submit — try again shortly" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
