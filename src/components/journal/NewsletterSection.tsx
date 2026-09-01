"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { subscribeNewsletter } from "@/app/journal/actions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      toast.error("Adresse email invalide.");
      return;
    }
    setIsPending(true);
    subscribeNewsletter(email)
      .then((result) => {
        if (result.error) {
          toast.error("Une erreur est survenue");
          return;
        }
        toast.success("Inscrit ✓");
        setSent(true);
      })
      .catch(() => toast.error("Une erreur est survenue"))
      .finally(() => setIsPending(false));
  }

  return (
    <section className="px-6 py-24 border-t" style={{ borderColor: "var(--kov-border)" }}>
      <div className="max-w-2xl mx-auto text-center">
        <span className="inline-flex items-center justify-center w-12 h-12 mb-6" style={{ background: "var(--kov-graphite)", borderRadius: "var(--radius-pill)" }}>
          <Mail size={18} strokeWidth={1.5} className="text-kov-red" />
        </span>
        <h2 className="font-display text-kov-bone uppercase text-2xl mb-3">Restez informés</h2>
        <p className="text-kov-steel text-sm mb-8">Un email de temps en temps, quand on a vraiment quelque chose à dire.</p>

        {sent ? (
          <p className="text-kov-red text-sm uppercase tracking-widest">Merci — à bientôt dans votre boîte mail.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              disabled={isPending}
              required
              className="w-full sm:w-72 bg-transparent border px-4 py-3 text-kov-bone text-sm placeholder:text-kov-steel focus:outline-none focus:border-kov-red transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--kov-border)", borderRadius: "var(--radius-sm)" }}
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-widest text-kov-white transition-colors disabled:opacity-50 whitespace-nowrap"
              style={{ background: "var(--kov-red)", borderRadius: "var(--radius-sm)" }}
            >
              {isPending ? "…" : "S'inscrire"}
            </button>
          </form>
        )}

        <p className="text-kov-steel text-[11px] mt-5">Vos données sont protégées et ne seront jamais partagées.</p>
      </div>
    </section>
  );
}
