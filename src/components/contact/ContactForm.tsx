"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

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
        company: data.get("company"),
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
      <GlassCard className="max-w-xl p-8 md:p-12">
        <p className="text-kov-bone text-lg">
          Message reçu<span className="text-kov-red">.</span> On revient vers vous rapidement.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-xl p-8 md:p-12">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label htmlFor="name" className="text-xs uppercase tracking-widest text-kov-steel">
            Nom
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
          <label htmlFor="company" className="text-xs uppercase tracking-widest text-kov-steel">
            Entreprise
          </label>
          <input id="company" name="company" type="text" className={FIELD_CLASS} />
        </div>

        <div>
          <label htmlFor="message" className="text-xs uppercase tracking-widest text-kov-steel">
            Votre projet
          </label>
          <textarea id="message" name="message" required rows={4} className={FIELD_CLASS} />
        </div>

        {status === "error" && (
          <p className="text-kov-red text-sm">Une erreur est survenue. Réessayez dans un instant.</p>
        )}

        <Button type="submit" variant="primary" disabled={status === "submitting"}>
          {status === "submitting" ? "Envoi…" : "Envoyer →"}
        </Button>
      </form>
    </GlassCard>
  );
}
