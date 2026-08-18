"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

const FIELD_CLASS =
  "w-full bg-transparent border-b py-3 text-kov-bone placeholder:text-kov-steel focus:outline-none focus:border-kov-red transition-colors";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = event.currentTarget;
    const data = new FormData(form);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        message: data.get("message"),
      }),
    });

    if (!response.ok) {
      setStatus("error");
      return;
    }

    setStatus("success");
    form.reset();
  }

  if (status === "success") {
    return (
      <p className="text-kov-bone text-lg max-w-md">
        Message received<span className="text-kov-red">.</span> We&apos;ll get back to you shortly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-8">
      <div>
        <label htmlFor="name" className="text-xs uppercase tracking-widest text-kov-steel">
          Name
        </label>
        <input id="name" name="name" type="text" required className={FIELD_CLASS} />
      </div>

      <div>
        <label htmlFor="email" className="text-xs uppercase tracking-widest text-kov-steel">
          Email
        </label>
        <input id="email" name="email" type="email" required className={FIELD_CLASS} />
      </div>

      <div>
        <label htmlFor="phone" className="text-xs uppercase tracking-widest text-kov-steel">
          Phone (optional)
        </label>
        <input id="phone" name="phone" type="tel" className={FIELD_CLASS} />
      </div>

      <div>
        <label htmlFor="message" className="text-xs uppercase tracking-widest text-kov-steel">
          Project
        </label>
        <textarea id="message" name="message" required rows={4} className={FIELD_CLASS} />
      </div>

      {status === "error" && (
        <p className="text-kov-red text-sm">Something went wrong. Try again in a moment.</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-block text-xs uppercase tracking-widest text-kov-bone border px-6 py-4 hover:text-kov-red hover:border-kov-red transition-colors disabled:opacity-50"
        style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
      >
        {status === "submitting" ? "Sending…" : "Send →"}
      </button>
    </form>
  );
}
